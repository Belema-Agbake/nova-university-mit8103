import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function firebaseAdminApp() {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Firebase token verification.");
  // In the Auth Emulator, the Admin SDK uses FIREBASE_AUTH_EMULATOR_HOST and
  // projectId automatically. Production uses Application Default Credentials.
  return initializeApp({ projectId });
}

export const firebaseAdminAuth = () => getAuth(firebaseAdminApp());
export const firebaseAdminFirestore = () => getFirestore(firebaseAdminApp());
