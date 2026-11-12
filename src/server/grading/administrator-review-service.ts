import "server-only";

import { AuditAction, Prisma, ResultStatus } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { ApplicationError } from "@/server/errors/application-error";
import { enqueueAcademicEvent } from "@/server/notifications/academic-event-service";
import { getPagination, type PaginationQuery } from "@/server/validation/pagination";

export async function listSubmittedResults(pagination: PaginationQuery) {
  const where: Prisma.ResultWhereInput = { status: { in: [ResultStatus.SUBMITTED, ResultStatus.CHANGES_REQUESTED] } };
  const [items, total] = await prisma.$transaction([
    prisma.result.findMany({
      where,
      ...getPagination(pagination),
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      select: {
        id: true, status: true, totalScore: true, letterGrade: true, gradePoint: true, submittedAt: true,
        registration: { select: { student: { select: { matriculationNumber: true, user: { select: { firstName: true, lastName: true } } } }, courseOffering: { select: { id: true, course: { select: { code: true, title: true } } } } } },
      },
    }),
    prisma.result.count({ where }),
  ]);
  return { items, total, page: pagination.page, pageSize: pagination.pageSize };
}

export async function reviewResult(actorId: string, resultId: string, action: "APPROVE" | "REJECT" | "REQUEST_CHANGES", reason?: string) {
  return prisma.$transaction(async transaction => {
    const result = await transaction.result.findUniqueOrThrow({ where: { id: resultId }, include: { registration: { include: { student: { include: { user: true } }, courseOffering: { include: { course: true } } } } } });
    if (result.status !== ResultStatus.SUBMITTED && result.status !== ResultStatus.CHANGES_REQUESTED) throw new ApplicationError("Only submitted results can be reviewed.", 409, "RESULT_NOT_REVIEWABLE");
    const nextStatus = action === "APPROVE" ? ResultStatus.APPROVED : ResultStatus.CHANGES_REQUESTED;
    const auditAction = action === "APPROVE" ? AuditAction.APPROVED : AuditAction.REOPENED;
    const updated = await transaction.result.update({ where: { id: resultId }, data: { status: nextStatus } });
    await transaction.resultAuditHistory.create({ data: { resultId, actorId, action: auditAction, details: { decision: action, reason: reason ?? null } } });
    const recipient = result.registration.student.user.firebaseUid;
    if (recipient) await enqueueAcademicEvent(transaction, { eventKey: `result:${resultId}:${action.toLowerCase()}`, eventType: action === "APPROVE" ? "RESULT_APPROVED" : "RESULT_CHANGES_REQUESTED", recipientFirebaseUid: recipient, title: action === "APPROVE" ? "Result approved" : "Result changes requested", message: action === "APPROVE" ? `${result.registration.courseOffering.course.code} has been approved for publication.` : `${result.registration.courseOffering.course.code} requires changes before approval.`, payload: { resultId, reason: reason ?? null } });
    return updated;
  });
}

export async function publishApprovedResult(actorId: string, resultId: string) {
  return prisma.$transaction(async transaction => {
    const result = await transaction.result.findUniqueOrThrow({ where: { id: resultId }, include: { registration: { include: { student: { include: { user: true } }, courseOffering: { include: { course: true } } } } } });
    if (result.status !== ResultStatus.APPROVED) throw new ApplicationError("Only approved results can be published.", 409, "RESULT_NOT_APPROVED");
    const updated = await transaction.result.update({ where: { id: resultId }, data: { status: ResultStatus.PUBLISHED, publishedAt: new Date() } });
    await transaction.resultAuditHistory.create({ data: { resultId, actorId, action: AuditAction.PUBLISHED, details: { source: "administrator" } } });
    const recipient = result.registration.student.user.firebaseUid;
    if (recipient) await enqueueAcademicEvent(transaction, { eventKey: `result:${resultId}:published`, eventType: "RESULT_PUBLISHED", recipientFirebaseUid: recipient, title: "Result published", message: `${result.registration.courseOffering.course.code} is now available in your academic records.`, payload: { resultId } });
    return updated;
  });
}
