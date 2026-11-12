import "server-only";

import type { NextRequest } from "next/server";
import { AccountVerificationStatus, UserRole } from "@prisma/client";

import { firebaseAdminAuth } from "@/server/authentication/firebase-admin";
import { prisma } from "@/server/database/prisma";
import { ApplicationError, AuthenticationRequiredError } from "@/server/errors/application-error";

export type AuthenticatedStudent = { id: string; userId: string; firebaseUid: string; programmeId: string; officialLevel: number; matriculationNumber: string; email: string; firstName: string; lastName: string };

export async function requireAuthenticatedStudent(request: NextRequest): Promise<AuthenticatedStudent> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new AuthenticationRequiredError();
  let decoded: { uid: string; email?: string };
  try { decoded = await firebaseAdminAuth().verifyIdToken(token, true); } catch { throw new AuthenticationRequiredError(); }
  if (!decoded.email) throw new AuthenticationRequiredError();
  const student = await prisma.student.findFirst({ where: { user: { firebaseUid: decoded.uid, email: decoded.email, role: UserRole.STUDENT, accountStatus: AccountVerificationStatus.ACTIVE } }, select: { id: true, userId: true, programmeId: true, officialLevel: true, matriculationNumber: true, user: { select: { firebaseUid: true, email: true, firstName: true, lastName: true } } } });
  if (!student) throw new ApplicationError("This Firebase account is not linked to an authorised student record.", 403, "STUDENT_ACCOUNT_NOT_LINKED");
  if (!student.user.firebaseUid) throw new ApplicationError("This Firebase account is not linked to an authorised student record.", 403, "STUDENT_ACCOUNT_NOT_LINKED");
  return { ...student, firebaseUid: student.user.firebaseUid, email: student.user.email, firstName: student.user.firstName, lastName: student.user.lastName };
}
