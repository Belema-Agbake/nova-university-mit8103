import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.projectId) {
  throw new Error("Firebase web configuration is incomplete. Set the NEXT_PUBLIC_FIREBASE_* values in .env.local.");
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
const emulatorKey = "__novaAuthEmulatorConnected";
const browserFlags = typeof window === "undefined" ? undefined : window as unknown as Record<string, boolean>;
if (browserFlags && process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR === "true" && !browserFlags[emulatorKey]) { connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true }); browserFlags[emulatorKey] = true; }
// Firestore is initialized here but has no browser-accessible collections until
// a location and reviewed role-based rules are explicitly configured.
export const firestore = getFirestore(firebaseApp);
