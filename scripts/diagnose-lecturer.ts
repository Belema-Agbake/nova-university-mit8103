import { PrismaClient } from "@prisma/client";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const prisma = new PrismaClient();
const email = "ejiamikejiamike@gmail.com";
if (!getApps().length) initializeApp({ projectId: "nova-university-89019", credential: applicationDefault() });

async function main() {
  const firebaseUser = await getAuth().getUserByEmail(email);
  const user = await prisma.user.findUnique({ where: { email }, include: { lecturer: { include: { department: true, assignments: { include: { courseOffering: { include: { course: true, semester: { include: { session: true } } } } } } } } } });
  console.log(JSON.stringify({ firebase: { uid: firebaseUser.uid, email: firebaseUser.email }, database: user ? { id: user.id, firebaseUid: user.firebaseUid, role: user.role, accountStatus: user.accountStatus, lecturer: user.lecturer ? { id: user.lecturer.id, staffNumber: user.lecturer.staffNumber, department: user.lecturer.department.name, assignments: user.lecturer.assignments.map(a => ({ code: a.courseOffering.course.code, session: a.courseOffering.semester.session.name })) } : null } : null }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
