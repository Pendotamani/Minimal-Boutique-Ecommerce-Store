# ig.lifestyles deployment notes

## Vercel

Deploy from the repository root. `vercel.json` builds the static storefront to `artifacts/atelier-store/dist/public`, routes client-side pages such as `/admin` back to the app, and exposes `/api/*` through the Express function in `api/[...path].ts`.

Set these environment variables in Vercel:

| Variable | Required | Purpose |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Firebase Admin service-account JSON; keep this in Vercel's encrypted environment settings only. |
| `UPI_VPA` | Yes for UPI intents | Merchant VPA used to build the UPI payment link. |
| `APP_ORIGIN` | Yes | Exact production origin, such as `https://your-store.vercel.app`; used for CORS and notification links. |
| `ALLOWED_ORIGINS` | Only for extra origins | Comma-separated exact origins; do not use `*`. |
| `VITE_FIREBASE_VAPID_KEY` | For push | Public Web Push certificate key from Firebase Console → Cloud Messaging. |
| `UPI_MERCHANT_NAME` | Optional | Payee label shown in UPI apps; defaults to `ig.lifestyles`. |
| `FIREBASE_PROJECT_ID` | Optional | Defaults to `iglifestyles`. |

The supplied Firebase web configuration is public client configuration and remains in the storefront. No server credential is bundled into the browser.

## Firebase setup

1. Enable Email/Password sign-in in Firebase Authentication and create the first admin user.
2. Set `FIREBASE_SERVICE_ACCOUNT_JSON` securely for the command environment, set `FIREBASE_ADMIN_EMAIL` to that existing user's email, then run `pnpm --filter @workspace/api-server run grant-admin`. The command grants the `admin: true` custom claim; the user must sign out and back in.
3. Deploy the included Firestore rules with Firebase CLI (`firebase deploy --only firestore:rules`). Orders are readable by admin-claim users and cannot be written directly by clients. `adminDevices` is server-only.
4. Configure Firebase Cloud Messaging Web Push and set `VITE_FIREBASE_VAPID_KEY` before building. Admins can then enable alerts from `/admin`; iOS push requires Safari 16.4+ and adding the site to the Home Screen.

## UPI scope

The API validates cart product IDs and calculates prices on the server, stores a pending order in Firestore, then returns a standard `upi://pay` intent. A payment gateway/webhook or bank/provider verification callback is not configured here. Consequently, `paymentStatus` remains `pending` until a verified payment callback is added; do not treat a UPI app handoff as proof of payment.

## Smoke checks after deployment

- `/`, `/shop/men`, `/product/jacket-black-bsr`, and `/admin` should load directly.
- `/api/healthz` should return `{ "status": "ok" }`.
- `/manifest.json` and `/firebase-messaging-sw.js` should return successfully over HTTPS.
- Checkout should create a pending Firestore order and offer a UPI intent only after Firebase Admin and `UPI_VPA` are configured.
