import type { NextFunction, Request, Response } from "express";
import { getFirebaseServices } from "../lib/firebase-admin";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    res.status(503).json({ error: "Firebase Admin is not configured." });
    return;
  }
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const { auth } = getFirebaseServices();
    const decoded = await auth.verifyIdToken(token, true);
    if (decoded.admin !== true) {
      res.status(403).json({ error: "Admin access required." });
      return;
    }
    res.locals.adminUid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Authentication could not be verified." });
  }
}
