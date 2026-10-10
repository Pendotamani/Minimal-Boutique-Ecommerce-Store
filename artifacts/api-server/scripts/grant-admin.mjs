import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const email = process.env.FIREBASE_ADMIN_EMAIL?.trim();

if (!serviceAccountJson || !email) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_ADMIN_EMAIL in the environment first.");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || "iglifestyles",
});
const auth = getAuth(app);

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(`Admin access granted to ${email}. Ask them to sign out and sign in again.`);
} catch {
  console.error("Could not grant admin access. Confirm the Firebase Auth user exists and the service account can manage users.");
  process.exitCode = 1;
}
