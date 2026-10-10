import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { ArrowLeft, Bell, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { registerAdminDevice, updateAdminOrderStatus } from "@workspace/api-client-react";
import { firebaseApp, firebaseAuth, firestore } from "@/lib/firebase";

type OrderStatus = "new" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
type OrderItem = { productId: string; productName: string; size: string; quantity: number; unitPrice: number; lineTotal: number };
type AdminOrder = {
  id: string;
  customerName: string;
  email?: string;
  phoneNumber: string;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  orderDate: Timestamp | null;
  orderStatus: OrderStatus;
  paymentStatus: string;
  totalAmount: number;
};

const statuses: OrderStatus[] = ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function orderDateLabel(orderDate: Timestamp | null) {
  return orderDate?.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) ?? "Date unavailable";
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("new");

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedId) ?? orders[0], [orders, selectedId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setError("");
      if (!currentUser) {
        setUser(null);
        return;
      }
      try {
        const token = await currentUser.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          setUser(null);
          setError("This account is signed in but does not have the admin role.");
          await signOut(firebaseAuth);
          return;
        }
        setUser(currentUser);
      } catch {
        setUser(null);
        setError("Admin access could not be verified. Please sign in again.");
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const ordersQuery = query(collection(firestore, "orders"), orderBy("orderDate", "desc"));
    return onSnapshot(ordersQuery, (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AdminOrder);
      setOrders(rows);
      setSelectedId((current) => current || rows[0]?.id || "");
    }, () => {
      setError("The live order feed is unavailable. Check the Firestore admin read rules.");
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !pushEnabled) return;
    let unsubscribe: (() => void) | undefined;
    void isSupported().then((supported) => {
      if (supported) unsubscribe = onMessage(getMessaging(firebaseApp), (payload) => {
        setNotice(payload.notification?.body || "A new order update is available.");
      });
    });
    return () => unsubscribe?.();
  }, [user?.uid, pushEnabled]);

  useEffect(() => {
    setStatus(selectedOrder?.orderStatus ?? "new");
  }, [selectedOrder?.id, selectedOrder?.orderStatus]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const token = await credential.user.getIdTokenResult(true);
      if (token.claims.admin !== true) {
        await signOut(firebaseAuth);
        setError("This account does not have the admin role.");
      }
    } catch {
      setError("Sign-in failed. Check the email, password, and Firebase Auth setup.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  async function handleStatusChange(nextStatus: OrderStatus) {
    if (!selectedOrder || nextStatus === selectedOrder.orderStatus) return;
    setSavingStatus(true);
    setError("");
    setNotice("");
    try {
      await updateAdminOrderStatus(selectedOrder.id, { orderStatus: nextStatus });
      setNotice("Order status updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order status could not be updated.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function enableNotifications() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error("This browser does not support web push notifications.");
      }
      if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
        throw new Error("Set VITE_FIREBASE_VAPID_KEY in the deployment environment before enabling notifications.");
      }
      const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const installed = window.matchMedia("(display-mode: standalone)").matches
        || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      if (iOS && !installed) {
        throw new Error("On iPhone or iPad, add ig.lifestyles to the Home Screen before enabling notifications.");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}firebase-messaging-sw.js`);
      const token = await getToken(getMessaging(firebaseApp), {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (!token) throw new Error("Firebase did not return a device token. Check the Cloud Messaging web-push setup.");
      await registerAdminDevice({ token });
      setPushEnabled(true);
      setNotice("This device is registered for new-order alerts.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Push notifications could not be enabled.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOut(firebaseAuth);
    setPushEnabled(false);
    setNotice("");
  }

  if (!user) {
    return <main className="admin-screen admin-login">
      <Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Back to ig.lifestyles</Link>
      <section className="admin-login-card">
        <span className="admin-overline"><ShieldCheck size={15} /> Private store access</span>
        <h1>Admin sign in</h1>
        <p>Sign in with an account assigned the Firebase <code>admin: true</code> role.</p>
        <form onSubmit={handleLogin} className="admin-login-form">
          <label>Email<input required autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : null} Sign in</button>
        </form>
        {error && <p role="alert" className="admin-error">{error}</p>}
      </section>
    </main>;
  }

  return <main className="admin-screen">
    <header className="admin-topbar">
      <Link href="/" className="admin-wordmark"><strong>ig.</strong> lifestyles <span>/ Admin</span></Link>
      <div className="admin-tools">
        <button type="button" className={`admin-secondary-button ${pushEnabled ? "is-enabled" : ""}`} onClick={enableNotifications} disabled={busy || pushEnabled}>
          {busy ? <LoaderCircle size={15} className="spin" /> : <Bell size={15} />}
          {pushEnabled ? "Alerts on" : "Enable alerts"}
        </button>
        <button type="button" className="admin-icon-button" aria-label="Sign out" onClick={handleLogout}><LogOut size={16} /></button>
      </div>
    </header>
    <div className="admin-heading">
      <div><span className="admin-overline">Order management</span><h1>Orders <span>{orders.length}</span></h1></div>
      <p>Live updates from Firestore</p>
    </div>
    {error && <p className="admin-alert admin-error" role="alert">{error}</p>}
    {notice && <p className="admin-alert admin-notice" role="status">{notice}</p>}
    <div className="admin-layout">
      <section className="admin-order-list" aria-label="Orders">
        {!orders.length ? <div className="admin-empty"><RefreshCw size={19} /><p>No orders yet.</p></div> : orders.map((order) => <button key={order.id} type="button" onClick={() => setSelectedId(order.id)} className={`admin-order-row ${selectedOrder?.id === order.id ? "selected" : ""}`}>
          <span><strong>{order.customerName || "Customer"}</strong><small>{orderDateLabel(order.orderDate)}</small></span>
          <span className={`admin-status status-${order.orderStatus}`}>{order.orderStatus}</span>
          <b>{formatPrice(order.totalAmount || 0)}</b>
        </button>)}
      </section>
      <section className="admin-order-detail" aria-label="Selected order details">
        {selectedOrder ? <>
          <div className="admin-detail-head">
            <div><span className="admin-overline">Order reference</span><h2>{selectedOrder.id}</h2><p>{orderDateLabel(selectedOrder.orderDate)}</p></div>
            <label className="admin-status-select">Status
              <select value={status} onChange={(event) => {
                const nextStatus = event.target.value as OrderStatus;
                setStatus(nextStatus);
                void handleStatusChange(nextStatus);
              }} disabled={savingStatus}>
                {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="admin-detail-grid">
            <div><span>Customer</span><strong>{selectedOrder.customerName}</strong>{selectedOrder.email && <small>{selectedOrder.email}</small>}</div>
            <div><span>Phone</span><strong>{selectedOrder.phoneNumber}</strong></div>
            <div><span>Delivery address</span><strong>{selectedOrder.address}</strong><small>{selectedOrder.city} · {selectedOrder.pincode}</small></div>
            <div><span>Payment</span><strong className={`admin-status status-${selectedOrder.paymentStatus}`}>{selectedOrder.paymentStatus}</strong></div>
          </div>
          <div className="admin-detail-items">
            <h3>Items</h3>
            {(selectedOrder.items ?? []).map((item, index) => <div key={`${item.productId}-${item.size}-${index}`}><span>{item.productName} · {item.size} × {item.quantity}</span><strong>{formatPrice(item.lineTotal)}</strong></div>)}
            <div className="admin-total"><span>Total</span><strong>{formatPrice(selectedOrder.totalAmount || 0)}</strong></div>
          </div>
        </> : <div className="admin-empty"><p>Select an order to see its details.</p></div>}
      </section>
    </div>
    <p className="admin-push-note">On iOS, install this site using Add to Home Screen before enabling push alerts.</p>
  </main>;
}
