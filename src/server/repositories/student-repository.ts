import "server-only";

import { prisma } from "@/server/database/prisma";
import { calculateAcademicResults, type AcademicAttempt } from "@/server/academic/grading-calculator";

/** Queries the minimum academic data needed by a future authenticated student view. */
export async function findStudentAcademicSummary(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      matriculationNumber: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      programme: { select: { code: true, name: true, award: true } },
    },
  });
}

export async function listStudentRegisteredCourses(studentId: string, semesterId: string) {
  return prisma.registration.findMany({
    where: { studentId, status: "REGISTERED", courseOffering: { semesterId } },
    orderBy: [{ courseOffering: { course: { code: "asc" } } }],
    select: {
      id: true,
      courseOffering: {
        select: {
          course: { select: { code: true, title: true, creditUnits: true } },
          schedules: { select: { weekday: true, startTime: true, endTime: true, room: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
        },
      },
    },
  });
}

export async function listPublishedStudentResults(studentId: string) {
  return prisma.result.findMany({
    where: { status: "PUBLISHED", registration: { studentId } },
    orderBy: [{ publishedAt: "desc" }],
    select: {
      totalScore: true,
      letterGrade: true,
      gradePoint: true,
      publishedAt: true,
      registration: { select: { courseOffering: { select: { course: { select: { code: true, title: true, creditUnits: true } }, semester: { select: { term: true, session: { select: { name: true } } } } } } } },
    },
  });
}

export async function getStudentAcademicHistory(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { id: true, officialLevel: true, matriculationNumber: true, user: { select: { firstName: true, lastName: true, email: true } }, programme: { select: { id: true, name: true, code: true, award: true } } } });
  const results = await prisma.result.findMany({
    where: { status: "PUBLISHED", registration: { studentId } },
    orderBy: [{ registration: { courseOffering: { course: { level: "asc" } } } }, { publishedAt: "asc" }],
    select: {
      totalScore: true, letterGrade: true, gradePoint: true, publishedAt: true,
      registration: {
        select: {
          courseOffering: {
            select: {
              course: { select: { id: true, code: true, title: true, creditUnits: true, level: true, requirements: { where: { programmeId: student.programme.id }, select: { isRequired: true } } } },
              semester: { select: { id: true, term: true, startDate: true, session: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  const rows = results.map(result => ({ result, course: result.registration.courseOffering.course, semester: result.registration.courseOffering.semester }));
  const attempts: AcademicAttempt[] = rows.map(({ result, course, semester }) => ({ courseId: course.id, courseCode: course.code, courseTitle: course.title, level: course.level, semesterId: semester.id, creditUnits: course.creditUnits, score: Number(result.totalScore), published: true, complete: true }));
  const levels = [...new Set(attempts.map(attempt => attempt.level))].sort((a, b) => a - b).map(level => { const calculation = calculateAcademicResults(attempts.filter(attempt => attempt.level === level)); return { level, ...calculation, gpa: Number(calculation.gpa.toFixed(2)) }; });
  const periodMap = new Map(rows.map(({ semester }) => [semester.id, semester]));
  const periods = [...periodMap.values()].sort((left, right) => left.startDate.getTime() - right.startDate.getTime()).map(semester => { const periodAttempts = attempts.filter(attempt => attempt.semesterId === semester.id); const calculation = calculateAcademicResults(periodAttempts); const level = periodAttempts[0]?.level ?? 0; const term = semester.term === "FIRST" ? "First semester" : semester.term === "SECOND" ? "Second semester" : "Summer semester"; return { id: semester.id, label: `${term} · ${semester.session.name}`, level, gpa: Number(calculation.gpa.toFixed(2)), attemptedUnits: calculation.attemptedUnits, qualityPoints: calculation.qualityPoints }; });
  const cumulative = calculateAcademicResults(attempts);
  return { student, results: rows.map(({ result, course, semester }) => ({ courseId: course.id, code: course.code, title: course.title, displayName: `${course.title} (${course.code})`, category: course.requirements[0]?.isRequired ? "Core" : "Elective", units: course.creditUnits, score: Number(result.totalScore), grade: result.letterGrade, gradePoint: Number(result.gradePoint), qualityPoints: course.creditUnits * Number(result.gradePoint), level: course.level, semester: semester.term, session: semester.session.name, publishedAt: result.publishedAt })), levels, periods, cumulative: { attemptedUnits: cumulative.attemptedUnits, qualityPoints: cumulative.qualityPoints, cgpa: cumulative.gpa, classification: cumulative.classification }, currentLevel: student.officialLevel };
}
