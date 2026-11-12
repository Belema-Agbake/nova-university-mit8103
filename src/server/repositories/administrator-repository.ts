import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import { getPagination, type PaginationQuery } from "@/server/validation/pagination";

export async function getAcademicOverview(semesterId: string) {
  const [activeStudents, lecturers, offerings, pendingApprovals] = await prisma.$transaction([
    prisma.registration.groupBy({ by: ["studentId"], orderBy: { studentId: "asc" }, where: { courseOffering: { semesterId }, status: "REGISTERED" } }),
    prisma.lecturer.count(),
    prisma.courseOffering.count({ where: { semesterId } }),
    prisma.result.count({ where: { status: { in: ["SUBMITTED", "CHANGES_REQUESTED"] }, registration: { courseOffering: { semesterId } } } }),
  ]);
  return { activeStudents: activeStudents.length, lecturers, offerings, pendingApprovals };
}

export async function listPendingResultApprovals(pagination: PaginationQuery) {
  const where: Prisma.ResultWhereInput = { status: { in: ["SUBMITTED", "CHANGES_REQUESTED"] } };
  const [items, total] = await prisma.$transaction([
    prisma.result.findMany({
      where,
      ...getPagination(pagination),
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      select: { id: true, status: true, submittedAt: true, registration: { select: { courseOffering: { select: { course: { select: { code: true, title: true } } } } } } },
    }),
    prisma.result.count({ where }),
  ]);
  return { items, total, page: pagination.page, pageSize: pagination.pageSize };
}
