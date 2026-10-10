import { createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CreateOrderBody,
  RegisterAdminDeviceBody,
  UpdateAdminOrderStatusBody,
  UpdateAdminOrderStatusParams,
} from "@workspace/api-zod";
import { Timestamp } from "firebase-admin/firestore";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middlewares/admin-auth";
import { getFirebaseServices } from "../lib/firebase-admin";
import { getShipping, storeCatalog, type StoreProductId } from "../lib/store-catalog";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const createOrderLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout attempts. Please wait and try again." },
});
const adminLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests. Please wait and try again." },
});

function sanitizePlainText(value: string) {
  return value.normalize("NFKC").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
}

router.post("/orders", createOrderLimit, async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the delivery details and cart items." });
    return;
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    res.status(503).json({ error: "Firebase order storage is not configured. No order or payment was created." });
    return;
  }

  const merchantVpa = process.env.UPI_VPA?.trim();
  if (!merchantVpa || !/^[\w.-]{2,256}@[a-zA-Z0-9.-]{2,64}$/.test(merchantVpa)) {
    res.status(503).json({ error: "UPI checkout is not configured yet. No order or payment was created." });
    return;
  }

  const customerName = sanitizePlainText(parsed.data.customerName);
  const address = sanitizePlainText(parsed.data.address);
  const city = sanitizePlainText(parsed.data.city);
  if (!customerName || !address || !city) {
    res.status(400).json({ error: "Please provide valid delivery details." });
    return;
  }

  const { items } = parsed.data;
  const pricedItems = [];
  for (const item of items) {
    if (!Object.hasOwn(storeCatalog, item.productId)) {
      res.status(400).json({ error: "One or more items are no longer available." });
      return;
    }
    const product = storeCatalog[item.productId as StoreProductId];
    pricedItems.push({
      productId: item.productId,
      productName: product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      lineTotal: product.unitPrice * item.quantity,
    });
  }

  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalAmount = subtotal + getShipping(subtotal);

  try {
    const { db } = getFirebaseServices();
    const orderRef = db.collection("orders").doc();
    await orderRef.create({
      customerName,
      ...(parsed.data.email ? { email: parsed.data.email.trim().toLowerCase() } : {}),
      phoneNumber: parsed.data.phoneNumber,
      address,
      city,
      pincode: parsed.data.pincode,
      items: pricedItems,
      orderDate: Timestamp.now(),
      orderStatus: "new",
      totalAmount,
      paymentStatus: "pending",
    });

    const query = new URLSearchParams({
      pa: merchantVpa,
      pn: process.env.UPI_MERCHANT_NAME?.trim() || "ig.lifestyles",
      am: totalAmount.toFixed(2),
      cu: "INR",
      tn: `ig.lifestyles order ${orderRef.id}`,
      tr: orderRef.id,
    });
    const upiUrl = `upi://pay?${query.toString()}`;
    void notifyAdmins(orderRef.id, totalAmount);
    res.status(201).json({
      orderId: orderRef.id,
      totalAmount,
      paymentStatus: "pending",
      upiUrl,
    });
  } catch (error) {
    logger.error({ message: error instanceof Error ? error.message : "Unknown error" }, "Order creation failed");
    res.status(503).json({ error: "Orders are temporarily unavailable. Please try again later." });
  }
});

router.post("/admin/devices", adminLimit, requireAdmin, async (req, res) => {
  const parsed = RegisterAdminDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A valid push notification token is required." });
    return;
  }

  try {
    const { db } = getFirebaseServices();
    const token = parsed.data.token;
    const tokenId = createHash("sha256").update(token).digest("hex");
    await db.collection("adminDevices").doc(tokenId).set({
      token,
      uid: res.locals.adminUid,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    res.status(201).json({ registered: true });
  } catch (error) {
    logger.error({ message: error instanceof Error ? error.message : "Unknown error" }, "Admin device registration failed");
    res.status(503).json({ error: "Push notifications are temporarily unavailable." });
  }
});

router.patch("/admin/orders/:orderId", adminLimit, requireAdmin, async (req, res) => {
  const path = UpdateAdminOrderStatusParams.safeParse(req.params);
  const body = UpdateAdminOrderStatusBody.safeParse(req.body);
  if (!path.success || !body.success) {
    res.status(400).json({ error: "Please select a valid order status." });
    return;
  }

  try {
    const { db } = getFirebaseServices();
    const orderRef = db.collection("orders").doc(path.data.orderId);
    const order = await orderRef.get();
    if (!order.exists) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    await orderRef.update({
      orderStatus: body.data.orderStatus,
      updatedAt: Timestamp.now(),
    });
    res.json({ orderId: orderRef.id, orderStatus: body.data.orderStatus });
  } catch (error) {
    logger.error({ message: error instanceof Error ? error.message : "Unknown error" }, "Admin order update failed");
    res.status(503).json({ error: "Order updates are temporarily unavailable." });
  }
});

async function notifyAdmins(orderId: string, totalAmount: number) {
  try {
    const { db, messaging } = getFirebaseServices();
    const devices = await db.collection("adminDevices").get();
    const deviceDocs = devices.docs.filter((doc) => typeof doc.get("token") === "string");
    if (!deviceDocs.length) return;

    const appOrigin = process.env.APP_ORIGIN?.replace(/\/+$/, "");
    const message = {
      tokens: deviceDocs.map((doc) => doc.get("token") as string),
      notification: {
        title: "New ig.lifestyles order",
        body: `${orderId} · ₹${totalAmount.toLocaleString("en-IN")} · awaiting review`,
      },
      ...(appOrigin ? { webpush: { fcmOptions: { link: `${appOrigin}/admin` } } } : {}),
    };
    for (let start = 0; start < deviceDocs.length; start += 500) {
      const batch = deviceDocs.slice(start, start + 500);
      const result = await messaging.sendEachForMulticast({
        ...message,
        tokens: batch.map((doc) => doc.get("token") as string),
      });
      const expiredTokens = result.responses
        .map((response, index) => ({ response, doc: batch[index] }))
        .filter(({ response }) => response.error?.code === "messaging/registration-token-not-registered" || response.error?.code === "messaging/invalid-registration-token")
        .map(({ doc }) => doc.ref.delete());
      await Promise.all(expiredTokens);
    }
  } catch (error) {
    logger.error({ message: error instanceof Error ? error.message : "Unknown error" }, "New-order push notification failed");
  }
}

export default router;
