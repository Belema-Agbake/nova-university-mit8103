import "server-only";
import { AccountVerificationStatus, UserRole } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { ApplicationError } from "@/server/errors/application-error";

export async function createImmediateAccount(input: { firebaseUid: string; email: string; firstName: string; lastName: string; role: UserRole; suppliedId: string }) {
  if (input.role === UserRole.ADMINISTRATOR) throw new ApplicationError("Administrator accounts are provisioned securely and cannot be created here.", 403, "ADMIN_SIGNUP_DISABLED");
  return prisma.$transaction(async (tx) => {
    const mapped = await tx.user.findUnique({ where: { firebaseUid: input.firebaseUid } });
    if (mapped) return mapped;
    const existingEmail = await tx.user.findUnique({ where: { email: input.email } });
    if (existingEmail) throw new ApplicationError("An official Nova identity already uses this email. Contact support to complete secure linking.", 409, "OFFICIAL_IDENTITY_LINK_REQUIRED");
    const officialMatch = input.role === UserRole.STUDENT
      ? await tx.student.findUnique({ where: { matriculationNumber: input.suppliedId } })
      : await tx.lecturer.findUnique({ where: { staffNumber: input.suppliedId } });
    if (officialMatch) throw new ApplicationError("This academic identity requires a trusted linking step. Your academic record remains protected.", 409, "OFFICIAL_IDENTITY_LINK_REQUIRED");
    return tx.user.create({ data: { firebaseUid: input.firebaseUid, email: input.email, firstName: input.firstName, lastName: input.lastName, role: input.role, accountStatus: AccountVerificationStatus.ACTIVE } });
  });
}
