import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export const firebaseConfig = {
  apiKey: "AIzaSyCnkuPRGXkmtcxRsSL8eaXDeY7ddQvB3jo",
  authDomain: "iglifestyles.firebaseapp.com",
  projectId: "iglifestyles",
  storageBucket: "iglifestyles.firebasestorage.app",
  messagingSenderId: "99691717046",
  appId: "1:99691717046:web:07a5ea6190949ba9b2e117",
  measurementId: "G-QSX7XHD013",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

setAuthTokenGetter(() => firebaseAuth.currentUser?.getIdToken() ?? null);
