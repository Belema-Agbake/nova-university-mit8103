import "server-only";

import { prisma } from "@/server/database/prisma";
import { getPagination, type PaginationQuery } from "@/server/validation/pagination";

/** Returns only offerings explicitly assigned to the supplied lecturer. */
export async function listLecturerAssignedCourses(lecturerId: string, semesterId: string) {
  return prisma.lecturerAssignment.findMany({
    where: { lecturerId, courseOffering: { semesterId } },
    orderBy: { courseOffering: { course: { code: "asc" } } },
    select: { isLead: true, courseOffering: { select: { id: true, course: { select: { code: true, title: true, creditUnits: true } }, programme: { select: { code: true } } } } },
  });
}

export async function listCourseRoster(courseOfferingId: string, pagination: PaginationQuery) {
  const where = { courseOfferingId, status: "REGISTERED" as const };
  const [items, total] = await prisma.$transaction([
    prisma.registration.findMany({
      where,
      ...getPagination(pagination),
      orderBy: { student: { matriculationNumber: "asc" } },
      select: { id: true, student: { select: { matriculationNumber: true, user: { select: { firstName: true, lastName: true } } } } },
    }),
    prisma.registration.count({ where }),
  ]);
  return { items, total, page: pagination.page, pageSize: pagination.pageSize };
}
