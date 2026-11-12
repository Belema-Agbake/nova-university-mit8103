import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";

const accounts = [
  { uid: "firebase-emulator-amina", email: "amina.student@nova.test", password: "NovaStudent!2026", displayName: "Amina Bello" },
  { uid: "firebase-emulator-michael", email: "michael.lecturer@nova.test", password: "NovaLecturer!2026", displayName: "Michael Adewale" },
  { uid: "firebase-emulator-admin", email: "ada.administrator@nova.test", password: "NovaAdmin!2026", displayName: "Ada Nwosu" },
];

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error("FIREBASE_AUTH_EMULATOR_HOST must be set; refusing to seed a non-emulator project.");
}

async function main() {
  const app = getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "nova-university-89019" });
  const auth = getAuth(app);

  for (const account of accounts) {
    let user: UserRecord;
    try {
      user = await auth.getUser(account.uid);
      user = await auth.updateUser(user.uid, { email: account.email, password: account.password, displayName: account.displayName, emailVerified: true, disabled: false });
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
      user = await auth.createUser({ ...account, emailVerified: true, disabled: false });
    }
    console.log(`seeded ${user.uid} (${user.email})`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
