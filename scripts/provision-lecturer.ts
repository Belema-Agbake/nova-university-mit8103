import { PrismaClient, AccountVerificationStatus, UserRole } from "@prisma/client";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const prisma = new PrismaClient();
const email = "ejiamikeedward512@gmail.com";
const password = process.env.LECTURER_PASSWORD;
if (!getApps().length) initializeApp({ projectId: "nova-university-89019", credential: applicationDefault() });

async function main() {
  const auth = getAuth();
  let firebaseUser;
  try { firebaseUser = await auth.getUserByEmail(email); if (password) await auth.updateUser(firebaseUser.uid, { password, displayName: "Edward Ejiamike" }); }
  catch { if (!password) throw new Error("Firebase lecturer account was not found; LECTURER_PASSWORD is required only to create a missing account."); firebaseUser = await auth.createUser({ email, password, displayName: "Edward Ejiamike", emailVerified: false }); }
  const department = await prisma.department.findFirstOrThrow({ where: { code: "CSC" } });
  const course = await prisma.course.findUniqueOrThrow({ where: { code: "CSC 409" } });
  const semester = await prisma.semester.findFirst({ where: { isCurrent: true }, orderBy: { startDate: "desc" } })
    ?? await prisma.semester.findFirst({ orderBy: { startDate: "desc" } });
  if (!semester) throw new Error("No academic semester exists in PostgreSQL; create the approved semester before assigning CSC 409.");
  const programme = await prisma.programme.findFirstOrThrow({ where: { departmentId: department.id } });
  const offering = await prisma.courseOffering.upsert({ where: { courseId_semesterId_programmeId: { courseId: course.id, semesterId: semester.id, programmeId: programme.id } }, update: {}, create: { courseId: course.id, semesterId: semester.id, programmeId: programme.id, capacity: 60 } });
  for (const schedule of [{ weekday: 1, start: "08:00", end: "13:00" }, { weekday: 2, start: "14:30", end: "17:00" }, { weekday: 5, start: "07:00", end: "09:00" }]) { const startTime = new Date(`1970-01-01T${schedule.start}:00Z`); const existing = await prisma.classSchedule.findFirst({ where: { courseOfferingId: offering.id, weekday: schedule.weekday, startTime } }); if (existing) await prisma.classSchedule.update({ where: { id: existing.id }, data: { endTime: new Date(`1970-01-01T${schedule.end}:00Z`), room: "To be announced" } }); else await prisma.classSchedule.create({ data: { courseOfferingId: offering.id, weekday: schedule.weekday, startTime, endTime: new Date(`1970-01-01T${schedule.end}:00Z`), room: "To be announced" } }); }
  await prisma.$transaction(async tx => {
    const user = await tx.user.upsert({ where: { email }, update: { firebaseUid: firebaseUser.uid, firstName: "Edward", lastName: "Ejiamike", role: UserRole.LECTURER, accountStatus: AccountVerificationStatus.ACTIVE }, create: { email, firebaseUid: firebaseUser.uid, firstName: "Edward", lastName: "Ejiamike", role: UserRole.LECTURER, accountStatus: AccountVerificationStatus.ACTIVE } });
    const lecturer = await tx.lecturer.upsert({ where: { staffNumber: "2723637384" }, update: { userId: user.id, departmentId: department.id }, create: { userId: user.id, departmentId: department.id, staffNumber: "2723637384" } });
    await tx.lecturerAssignment.upsert({ where: { lecturerId_courseOfferingId: { lecturerId: lecturer.id, courseOfferingId: offering.id } }, update: { isLead: true }, create: { lecturerId: lecturer.id, courseOfferingId: offering.id, isLead: true } });
  });
  console.log("Lecturer provisioned and CSC 409 assigned.");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
