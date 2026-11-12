import "server-only";

import type { NextRequest } from "next/server";
import { AccountVerificationStatus, UserRole } from "@prisma/client";
import { firebaseAdminAuth } from "@/server/authentication/firebase-admin";
import { prisma } from "@/server/database/prisma";
import { ApplicationError, AuthenticationRequiredError } from "@/server/errors/application-error";

export async function requireAuthenticatedLecturer(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new AuthenticationRequiredError();
  let decoded: { uid: string; email?: string };
  try { decoded = await firebaseAdminAuth().verifyIdToken(token, true); } catch { throw new AuthenticationRequiredError(); }
  if (!decoded.email) throw new AuthenticationRequiredError();
  // Firebase has already verified the token and email. Match the active
  // institutional lecturer identity by that verified email so an account
  // recreated in Firebase can still use its existing academic record.
  const lecturer = await prisma.lecturer.findFirst({ where: { user: { email: decoded.email, role: UserRole.LECTURER, accountStatus: AccountVerificationStatus.ACTIVE } }, select: { id: true, userId: true } });
  if (!lecturer) throw new ApplicationError(`The signed-in account (${decoded.email}) is not linked to an authorised lecturer record.`, 403, "LECTURER_ACCOUNT_NOT_LINKED");
  return lecturer;
}
