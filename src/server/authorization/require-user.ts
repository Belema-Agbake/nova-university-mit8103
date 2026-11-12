import "server-only";

import type { NextRequest } from "next/server";
import { AccountVerificationStatus, UserRole } from "@prisma/client";
import { firebaseAdminAuth } from "@/server/authentication/firebase-admin";
import { prisma } from "@/server/database/prisma";
import { ApplicationError, AuthenticationRequiredError } from "@/server/errors/application-error";

export type AuthenticatedUser = { id: string; firebaseUid: string; email: string; firstName: string; lastName: string; role: UserRole; hasAcademicIdentity: boolean };

export async function requireUser(request: NextRequest, roles?: UserRole[]): Promise<AuthenticatedUser> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new AuthenticationRequiredError();
  let decoded: { uid: string; email?: string };
  try { decoded = await firebaseAdminAuth().verifyIdToken(token, true); } catch { throw new AuthenticationRequiredError(); }
  if (!decoded.email) throw new AuthenticationRequiredError();
  const user = await prisma.user.findFirst({ where: { firebaseUid: decoded.uid, email: decoded.email, accountStatus: AccountVerificationStatus.ACTIVE }, include: { student: true, lecturer: true } });
  if (!user) throw new ApplicationError("This account has not completed secure Nova setup.", 403, "ACCOUNT_SETUP_REQUIRED");
  if (roles && !roles.includes(user.role)) throw new ApplicationError("You do not have permission for this resource.", 403, "ROLE_FORBIDDEN");
  return { id: user.id, firebaseUid: decoded.uid, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, hasAcademicIdentity: Boolean(user.student || user.lecturer || user.role === UserRole.ADMINISTRATOR) };
}
