import { loadEnvConfig } from "@next/env";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import { AccountVerificationStatus, PrismaClient, UserRole } from "@prisma/client";

loadEnvConfig(process.cwd());
const databaseUrl = process.env.TEST_DATABASE_URL;
const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!databaseUrl || !/^postgresql:\/\/.*@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(databaseUrl) || !databaseUrl.includes("nova_university_test")) throw new Error("This workflow only permits the isolated local nova_university_test database.");
if (!emulatorHost) throw new Error("FIREBASE_AUTH_EMULATOR_HOST is required; production Firebase is refused.");
const password = process.env.BELEMA_INITIAL_PASSWORD;
if (!password) throw new Error("Provide BELEMA_INITIAL_PASSWORD only at execution time.");

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const email = "belemaagbake@gmail.com";
const provisionalId = "PROV-301898585";
const app = getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "nova-university-89019" });
const auth = getAuth(app);

async function main() {
  let firebaseUser: UserRecord;
  let createdFirebaseUser = false;
  try {
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
      firebaseUser = await auth.createUser({ email, password, displayName: "Belema Agbake", disabled: false, emailVerified: false });
      createdFirebaseUser = true;
    }

    const provisioned = await prisma.$transaction(async tx => {
      const department = await tx.department.findUniqueOrThrow({ where: { code: "CSC" } });
      const existingProgramme = await tx.programme.findFirst({ where: { OR: [{ code: "BSC-CS" }, { name: "Computer Science" }, { name: "Computer Science and Programming" }], departmentId: department.id } });
      const programme = existingProgramme
        ? await tx.programme.update({ where: { id: existingProgramme.id }, data: { code: "BSC-CS", name: "Computer Science and Programming", durationYears: 5 } })
        : await tx.programme.create({ data: { id: "prog_bsc_cs_programming", code: "BSC-CS", name: "Computer Science and Programming", award: "B.Sc.", durationYears: 5, departmentId: department.id } });
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser && existingUser.firebaseUid && existingUser.firebaseUid !== firebaseUser.uid) throw new Error("The email is already linked to a different Firebase UID.");
      const user = existingUser
        ? await tx.user.update({ where: { id: existingUser.id }, data: { firebaseUid: firebaseUser.uid, firstName: "Belema", lastName: "Agbake", role: UserRole.STUDENT, accountStatus: AccountVerificationStatus.ACTIVE } })
        : await tx.user.create({ data: { email, firebaseUid: firebaseUser.uid, firstName: "Belema", lastName: "Agbake", role: UserRole.STUDENT, accountStatus: AccountVerificationStatus.ACTIVE } });
      const existingStudent = await tx.student.findUnique({ where: { matriculationNumber: provisionalId } });
      if (existingStudent && existingStudent.userId !== user.id) throw new Error("The provisional student identifier is already assigned to another user.");
      const student = existingStudent
        ? await tx.student.update({ where: { id: existingStudent.id }, data: { programmeId: programme.id, officialLevel: 500 } })
        : await tx.student.create({ data: { userId: user.id, matriculationNumber: provisionalId, programmeId: programme.id, entryYear: new Date().getUTCFullYear() - 4, officialLevel: 500 } });
      return { programme, user, student };
    });
    console.log(JSON.stringify({ database: "nova_university_test", firebaseEmulator: emulatorHost, firebaseUid: firebaseUser.uid, programme: { id: provisioned.programme.id, code: provisioned.programme.code, name: provisioned.programme.name, durationYears: provisioned.programme.durationYears }, user: { id: provisioned.user.id, email: provisioned.user.email, role: provisioned.user.role, accountStatus: provisioned.user.accountStatus }, student: { id: provisioned.student.id, provisionalId: provisioned.student.matriculationNumber, officialLevel: provisioned.student.officialLevel }, results: "not imported; official course catalogue, sessions, semesters and approval are required" }, null, 2));
  } catch (error) {
    if (createdFirebaseUser) await auth.deleteUser(firebaseUser!.uid);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
