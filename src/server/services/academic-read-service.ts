import "server-only";

import * as administratorRepository from "@/server/repositories/administrator-repository";
import * as lecturerRepository from "@/server/repositories/lecturer-repository";
import * as studentRepository from "@/server/repositories/student-repository";
import type { PaginationQuery } from "@/server/validation/pagination";

/** Service boundary for read models; authentication will supply scoped IDs in Phase 3. */
export const academicReadService = {
  getStudentSummary: studentRepository.findStudentAcademicSummary,
  listStudentCourses: studentRepository.listStudentRegisteredCourses,
  listPublishedStudentResults: studentRepository.listPublishedStudentResults,
  getStudentAcademicHistory: studentRepository.getStudentAcademicHistory,
  listLecturerCourses: lecturerRepository.listLecturerAssignedCourses,
  listCourseRoster: (courseOfferingId: string, pagination: PaginationQuery) => lecturerRepository.listCourseRoster(courseOfferingId, pagination),
  getAcademicOverview: administratorRepository.getAcademicOverview,
  listPendingApprovals: (pagination: PaginationQuery) => administratorRepository.listPendingResultApprovals(pagination),
};
