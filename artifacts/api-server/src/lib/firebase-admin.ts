import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export function getFirebaseServices() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");

  const app = getApps()[0] ?? initializeApp({
    credential: cert(JSON.parse(serviceAccountJson) as ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || "iglifestyles",
  });

  return {
    auth: getAuth(app),
    db: getFirestore(app),
    messaging: getMessaging(app),
  };
}
