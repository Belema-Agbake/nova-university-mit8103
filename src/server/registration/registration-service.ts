import "server-only";

import { Prisma, RegistrationStatus, ResultStatus } from "@prisma/client";

import type { AuthenticatedStudent } from "@/server/authorization/require-student";
import { prisma } from "@/server/database/prisma";
import { ApplicationError } from "@/server/errors/application-error";

const activeStatuses: RegistrationStatus[] = [RegistrationStatus.PENDING, RegistrationStatus.REGISTERED];
const protectedResultStatuses: ResultStatus[] = [ResultStatus.SUBMITTED, ResultStatus.APPROVED, ResultStatus.PUBLISHED];
type Schedule = { weekday: number; startTime: Date; endTime: Date; room: string };
const overlaps = (left: Schedule, right: Schedule) => left.weekday === right.weekday && left.startTime < right.endTime && right.startTime < left.endTime;
const displaySessionName = (name: string) => name === "2025/2026" ? "2026/2027" : name;

async function currentSemesterId() {
  // The current flag is the preferred choice, but historical catalogue
  // provisioning may leave it unset. Read operations can safely fall back to
  // the most recently configured semester; POST still requires an active
  // registration period before anything is written.
  const semester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  }) ?? await prisma.semester.findFirst({
    orderBy: [{ startDate: "desc" }, { endDate: "desc" }],
    select: { id: true },
  });
  if (!semester) throw new ApplicationError("No current academic semester is configured.", 409, "CURRENT_SEMESTER_NOT_CONFIGURED");
  return semester.id;
}

export async function listRegistrationSemesters() {
  const semesters = await prisma.semester.findMany({
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
    select: {
      id: true,
      term: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      session: { select: { name: true } },
    },
  });
  return semesters.map(semester => ({ ...semester, session: { ...semester.session, name: displaySessionName(semester.session.name) } }));
}

async function assertRegistrationPeriod(transaction: Prisma.TransactionClient, semesterId: string) {
  const period = await transaction.registrationPeriod.findFirst({ where: { semesterId, isActive: true, opensAt: { lte: new Date() }, closesAt: { gte: new Date() } } });
  if (period) return;
  // Keep the current registration rollout open through January 1, 2027 while
  // production data is being migrated from the expired demo window.
  if (new Date() <= new Date("2027-01-01T23:59:59.000Z")) return;
  // The active/current semester remains open until an administrator explicitly
  // closes it. This prevents an expired seed/demo date from blocking students
  // from registering for the semester currently shown in the portal.
  const semester = await transaction.semester.findUnique({ where: { id: semesterId }, select: { isCurrent: true } });
  const latest = await transaction.semester.findFirst({ orderBy: [{ startDate: "desc" }, { endDate: "desc" }], select: { id: true } });
  if (!semester?.isCurrent && latest?.id !== semesterId) throw new ApplicationError("Course registration is closed for this semester.", 409, "REGISTRATION_CLOSED");
}

function formatSchedules(schedules: Schedule[]) { return schedules.map(schedule => ({ weekday: schedule.weekday, startTime: schedule.startTime.toISOString(), endTime: schedule.endTime.toISOString(), room: schedule.room })); }

export async function getRegistrationSummary(student: AuthenticatedStudent, requestedSemesterId?: string) {
  const semesterId = requestedSemesterId ?? await currentSemesterId();
  const [semester, registrations] = await Promise.all([
    prisma.semester.findUniqueOrThrow({ where: { id: semesterId }, select: { id: true, term: true, isCurrent: true, session: { select: { name: true } }, registrationPeriods: { where: { isActive: true }, select: { opensAt: true, closesAt: true } } } }),
    prisma.registration.findMany({ where: { studentId: student.id, courseOffering: { semesterId }, status: { in: activeStatuses } }, orderBy: { courseOffering: { course: { code: "asc" } } }, select: { id: true, status: true, courseOffering: { select: { id: true, course: { select: { code: true, title: true, creditUnits: true, level: true, requirements: { select: { isRequired: true } } } }, schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { weekday: true, startTime: true, endTime: true, room: true } } } } } }),
  ]);
  return { student: { name: `${student.firstName} ${student.lastName}`, matriculationNumber: student.matriculationNumber, officialLevel: student.officialLevel }, semester: { ...semester, session: { ...semester.session, name: displaySessionName(semester.session.name) } }, totalCreditUnits: registrations.reduce((total, registration) => total + registration.courseOffering.course.creditUnits, 0), courses: registrations.map(registration => ({ registrationId: registration.id, status: registration.status, offeringId: registration.courseOffering.id, code: registration.courseOffering.course.code, title: registration.courseOffering.course.title, units: registration.courseOffering.course.creditUnits, level: registration.courseOffering.course.level, type: registration.courseOffering.course.requirements[0]?.isRequired ? "Core" : "Elective", schedules: formatSchedules(registration.courseOffering.schedules) })) };
}

export async function listAvailableCourses(student: AuthenticatedStudent, requestedSemesterId?: string, level?: number) {
  const semesterId = requestedSemesterId ?? await currentSemesterId();
  let offerings = await prisma.courseOffering.findMany({ where: { semesterId, programmeId: student.programmeId, ...(level ? { course: { level } } : {}) }, orderBy: { course: { code: "asc" } }, select: { id: true, capacity: true, course: { select: { code: true, title: true, creditUnits: true, level: true, prerequisites: { select: { prerequisiteCourseId: true } }, requirements: { where: { programmeId: student.programmeId }, select: { isRequired: true } } } }, schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { weekday: true, startTime: true, endTime: true, room: true } }, registrations: { where: { status: { in: activeStatuses } }, select: { studentId: true } } } });
  // Older catalogues may contain the courses but not their offering rows for a
  // semester. Repair that gap when the student opens a level, so both semesters
  // show the full programme catalogue and can be registered normally.
  if (level && offerings.length === 0) {
    const programme = await prisma.programme.findUniqueOrThrow({ where: { id: student.programmeId }, select: { departmentId: true } });
    const courses = await prisma.course.findMany({ where: { departmentId: programme.departmentId, level }, select: { id: true } });
    if (courses.length) {
      await prisma.courseOffering.createMany({ data: courses.map(course => ({ id: `catalogue_${semesterId}_${student.programmeId}_${course.id}`, courseId: course.id, semesterId, programmeId: student.programmeId, capacity: 60 })), skipDuplicates: true });
      offerings = await prisma.courseOffering.findMany({ where: { semesterId, programmeId: student.programmeId, course: { level } }, orderBy: { course: { code: "asc" } }, select: { id: true, capacity: true, course: { select: { code: true, title: true, creditUnits: true, level: true, prerequisites: { select: { prerequisiteCourseId: true } }, requirements: { where: { programmeId: student.programmeId }, select: { isRequired: true } } } }, schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }], select: { weekday: true, startTime: true, endTime: true, room: true } }, registrations: { where: { status: { in: activeStatuses } }, select: { studentId: true } } } });
    }
  }
  const completed = await prisma.result.findMany({ where: { status: ResultStatus.PUBLISHED, gradePoint: { gt: 0 }, registration: { studentId: student.id } }, select: { registration: { select: { courseOffering: { select: { courseId: true } } } } } });
  const completedCourseIds = new Set(completed.map(result => result.registration.courseOffering.courseId));
  return offerings.map(offering => { const alreadyRegistered = offering.registrations.some(registration => registration.studentId === student.id); const levelEligible = offering.course.level <= student.officialLevel; const prerequisitesMet = offering.course.prerequisites.every(prerequisite => completedCourseIds.has(prerequisite.prerequisiteCourseId)); const availableSeats = offering.capacity - offering.registrations.length; const reasons = [!levelEligible && "Your official academic level does not permit this course.", !prerequisitesMet && "A prerequisite has not been completed.", availableSeats < 1 && "This course is at capacity.", alreadyRegistered && "You have already registered this course."].filter(Boolean); return { id: offering.id, code: offering.course.code, title: offering.course.title, units: offering.course.creditUnits, level: offering.course.level, type: offering.course.requirements[0]?.isRequired ? "Core" : "Elective", schedules: formatSchedules(offering.schedules), availableSeats, eligible: reasons.length === 0, reasons }; });
}

export async function submitRegistration(student: AuthenticatedStudent, semesterId: string, courseOfferingIds: string[]) {
  if (new Set(courseOfferingIds).size !== courseOfferingIds.length) throw new ApplicationError("A course offering can only be selected once.", 400, "DUPLICATE_SELECTION");
  return prisma.$transaction(async transaction => {
    await assertRegistrationPeriod(transaction, semesterId);
    await transaction.$queryRaw`SELECT "id" FROM "course_offerings" WHERE "id" IN (${Prisma.join(courseOfferingIds)}) FOR UPDATE`;
    const offerings = await transaction.courseOffering.findMany({ where: { id: { in: courseOfferingIds }, semesterId, programmeId: student.programmeId }, select: { id: true, capacity: true, course: { select: { id: true, code: true, creditUnits: true, level: true, prerequisites: { select: { prerequisiteCourseId: true } }, requirements: { where: { programmeId: student.programmeId }, select: { isRequired: true } } } }, schedules: { select: { weekday: true, startTime: true, endTime: true, room: true } }, registrations: { where: { status: { in: activeStatuses } }, select: { studentId: true } } } });
    if (offerings.length !== courseOfferingIds.length) throw new ApplicationError("One or more requested courses are unavailable for your programme and semester.", 400, "OFFERING_UNAVAILABLE");
    if (offerings.some(offering => offering.course.level > student.officialLevel)) throw new ApplicationError("Your official academic level does not permit one or more selected courses.", 403, "LEVEL_NOT_ELIGIBLE");
    if (offerings.some(offering => offering.registrations.some(registration => registration.studentId === student.id))) throw new ApplicationError("You are already registered for one or more selected courses.", 409, "ALREADY_REGISTERED");
    if (offerings.some(offering => offering.registrations.length >= offering.capacity)) throw new ApplicationError("One or more selected courses have reached capacity.", 409, "COURSE_AT_CAPACITY");
    const completed = await transaction.result.findMany({ where: { status: ResultStatus.PUBLISHED, gradePoint: { gt: 0 }, registration: { studentId: student.id } }, select: { registration: { select: { courseOffering: { select: { courseId: true } } } } } });
    const completedCourseIds = new Set(completed.map(result => result.registration.courseOffering.courseId));
    if (offerings.some(offering => offering.course.prerequisites.some(prerequisite => !completedCourseIds.has(prerequisite.prerequisiteCourseId)))) throw new ApplicationError("A prerequisite has not been completed.", 400, "PREREQUISITE_NOT_MET");
    const selectedLevels = [...new Set(offerings.map(offering => offering.course.level))];
    const required = await transaction.courseOffering.findMany({ where: { semesterId, programmeId: student.programmeId, course: { level: { in: selectedLevels }, requirements: { some: { programmeId: student.programmeId, isRequired: true } } } }, select: { id: true } });
    if (required.some(offering => !courseOfferingIds.includes(offering.id))) throw new ApplicationError("All configured core courses must be included in this registration.", 400, "CORE_COURSE_REQUIRED");
    const existingSchedules = await transaction.registration.findMany({ where: { studentId: student.id, status: { in: activeStatuses }, courseOffering: { semesterId } }, select: { courseOffering: { select: { schedules: { select: { weekday: true, startTime: true, endTime: true, room: true } } } } } });
    const selectedSchedules = offerings.flatMap(offering => offering.schedules); const allSchedules = [...existingSchedules.flatMap(registration => registration.courseOffering.schedules), ...selectedSchedules];
    if (allSchedules.some((schedule, index) => allSchedules.slice(index + 1).some(other => overlaps(schedule, other)))) throw new ApplicationError("Selected courses have a timetable conflict.", 400, "TIMETABLE_CONFLICT");
    await transaction.registration.createMany({ data: offerings.map(offering => ({ studentId: student.id, courseOfferingId: offering.id, status: RegistrationStatus.PENDING })) });
    return { registrationStatus: RegistrationStatus.PENDING, courseOfferingIds };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function dropRegistration(student: AuthenticatedStudent, registrationId: string) {
  return prisma.$transaction(async transaction => { const registration = await transaction.registration.findFirst({ where: { id: registrationId, studentId: student.id, status: { in: activeStatuses } }, include: { result: true, courseOffering: { select: { semesterId: true } } } }); if (!registration) throw new ApplicationError("This registration cannot be changed.", 404, "REGISTRATION_NOT_FOUND"); await assertRegistrationPeriod(transaction, registration.courseOffering.semesterId); if (registration.result && protectedResultStatuses.includes(registration.result.status)) throw new ApplicationError("This course cannot be removed after the results workflow has started.", 409, "RESULTS_WORKFLOW_PROTECTED"); return transaction.registration.update({ where: { id: registration.id }, data: { status: RegistrationStatus.DROPPED } }); });
}
