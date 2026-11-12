import "server-only";

import type { Prisma } from "@prisma/client";
import { AuditAction, ResultStatus, UploadStatus } from "@prisma/client";
import { ApplicationError } from "@/server/errors/application-error";
import { prisma } from "@/server/database/prisma";

type GradeInput = { registrationId: string; componentId: string; score: number };

async function assignedOffering(lecturerId: string, offeringId: string, transaction: Prisma.TransactionClient | typeof prisma = prisma) {
  const assignment = await transaction.lecturerAssignment.findFirst({ where: { lecturerId, courseOfferingId: offeringId }, select: { courseOfferingId: true } });
  if (!assignment) throw new ApplicationError("You are not assigned to this course.", 403, "LECTURER_COURSE_FORBIDDEN");
  return transaction.courseOffering.findUniqueOrThrow({ where: { id: offeringId }, include: { components: true, semester: { include: { session: true } } } });
}

function validateWeights(components: { weightPercent: Prisma.Decimal }[]) {
  const total = components.reduce((sum, component) => sum + Number(component.weightPercent), 0);
  if (Math.abs(total - 100) > 0.001) throw new ApplicationError("Assessment component weights must total 100%.", 400, "ASSESSMENT_WEIGHTS_INVALID");
}

function validateScore(score: number, maximum: number) {
  if (!Number.isFinite(score) || score < 0 || score > maximum) throw new ApplicationError(`Score must be between 0 and ${maximum}.`, 400, "SCORE_OUT_OF_RANGE");
}

async function upsertResult(transaction: Prisma.TransactionClient, registrationId: string, actorId: string, submit: boolean) {
  const registration = await transaction.registration.findUniqueOrThrow({ where: { id: registrationId }, include: { courseOffering: { include: { components: true, semester: { include: { session: true } } } } } });
  validateWeights(registration.courseOffering.components);
  const scores = await transaction.assessmentScore.findMany({ where: { registrationId }, include: { component: true } });
  if (scores.length !== registration.courseOffering.components.length) throw new ApplicationError("Every assessment component needs a score before submission.", 400, "INCOMPLETE_RESULT");
  const totalScore = scores.reduce((sum, score) => sum + Number(score.score), 0);
  const policy = await transaction.gradingPolicy.findFirst({ where: { sessionId: registration.courseOffering.semester.sessionId, programmeId: registration.courseOffering.programmeId, isDefault: true }, include: { scaleEntries: true } });
  const scale = policy?.scaleEntries.find(entry => totalScore >= Number(entry.minimumScore) && totalScore <= Number(entry.maximumScore));
  if (!scale) throw new ApplicationError("No grading scale entry matches this result.", 400, "GRADE_SCALE_NOT_CONFIGURED");
  const existing = await transaction.result.findUnique({ where: { registrationId } });
  if (existing?.status === ResultStatus.PUBLISHED || existing?.status === ResultStatus.APPROVED) throw new ApplicationError("This result is no longer editable by a lecturer.", 409, "RESULT_LOCKED");
  const result = await transaction.result.upsert({ where: { registrationId }, create: { registrationId, totalScore, letterGrade: scale.grade, gradePoint: scale.gradePoint, status: submit ? ResultStatus.SUBMITTED : ResultStatus.DRAFT, submittedAt: submit ? new Date() : null }, update: { totalScore, letterGrade: scale.grade, gradePoint: scale.gradePoint, status: submit ? ResultStatus.SUBMITTED : ResultStatus.DRAFT, submittedAt: submit ? new Date() : existing?.submittedAt } });
  await transaction.resultAuditHistory.create({ data: { resultId: result.id, actorId, action: submit ? AuditAction.SUBMITTED : AuditAction.UPDATED, details: { totalScore, letterGrade: scale.grade } } });
  return result;
}

export async function listLecturerGradingCourses(lecturerId: string, semesterId: string) {
  return prisma.lecturerAssignment.findMany({ where: { lecturerId, courseOffering: { semesterId } }, orderBy: { courseOffering: { course: { code: "asc" } } }, select: { courseOffering: { select: { id: true, course: { select: { code: true, title: true, creditUnits: true } }, schedules: { select: { weekday: true, startTime: true, endTime: true, room: true } }, components: { orderBy: { name: "asc" }, select: { id: true, name: true, weightPercent: true, maximumScore: true } } } } } });
}

export async function getLecturerRoster(lecturerId: string, offeringId: string) {
  await assignedOffering(lecturerId, offeringId);
  return prisma.registration.findMany({ where: { courseOfferingId: offeringId, status: "REGISTERED" }, orderBy: { student: { matriculationNumber: "asc" } }, select: { id: true, student: { select: { matriculationNumber: true, user: { select: { firstName: true, lastName: true } } } }, result: { select: { id: true, status: true, totalScore: true, letterGrade: true, gradePoint: true } }, assessmentScores: { select: { assessmentComponentId: true, score: true } } } });
}

export async function saveLecturerGrades(lecturerId: string, actorId: string, offeringId: string, grades: GradeInput[], submit = false) {
  return prisma.$transaction(async transaction => {
    const offering = await assignedOffering(lecturerId, offeringId, transaction);
    validateWeights(offering.components);
    const componentMap = new Map(offering.components.map(component => [component.id, component]));
    for (const grade of grades) {
      const registration = await transaction.registration.findFirst({ where: { id: grade.registrationId, courseOfferingId: offeringId, status: "REGISTERED" } });
      if (!registration) throw new ApplicationError("Every grade must belong to an enrolled student in this course.", 400, "REGISTRATION_NOT_ENROLLED");
      const component = componentMap.get(grade.componentId);
      if (!component) throw new ApplicationError("Assessment component does not belong to this course.", 400, "COMPONENT_NOT_IN_COURSE");
      validateScore(grade.score, Number(component.maximumScore));
      await transaction.assessmentScore.upsert({ where: { registrationId_assessmentComponentId: { registrationId: grade.registrationId, assessmentComponentId: grade.componentId } }, create: { registrationId: grade.registrationId, assessmentComponentId: grade.componentId, score: grade.score }, update: { score: grade.score } });
    }
    const registrationIds = [...new Set(grades.map(grade => grade.registrationId))];
    const results = [];
    for (const registrationId of registrationIds) results.push(await upsertResult(transaction, registrationId, actorId, submit));
    return results;
  });
}

export async function uploadLecturerGrades(lecturerId: string, actorId: string, offeringId: string, filename: string, rows: Record<string, string>[]) {
  return prisma.$transaction(async transaction => {
    const offering = await assignedOffering(lecturerId, offeringId, transaction);
    validateWeights(offering.components);
    const errors: { rowNumber: number; field: string; message: string; rawValue?: string }[] = [];
    const valid: GradeInput[] = [];
    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const matriculationNumber = row.matriculationNumber ?? row.matriculation_number ?? row.MatriculationNumber;
      const registration = matriculationNumber ? await transaction.registration.findFirst({ where: { courseOfferingId: offeringId, status: "REGISTERED", student: { matriculationNumber } } }) : null;
      if (!registration) { errors.push({ rowNumber, field: "matriculationNumber", message: "Student is not enrolled in this course.", rawValue: matriculationNumber }); continue; }
      const rowGrades: GradeInput[] = [];
      const rowErrorCount = errors.length;
      for (const component of offering.components) {
        const raw = row[component.name] ?? row[component.name.toLowerCase()] ?? row[component.id];
        const score = Number(raw);
        if (raw === undefined || raw === "") errors.push({ rowNumber, field: component.name, message: "Score is required." });
        else if (!Number.isFinite(score) || score < 0 || score > Number(component.maximumScore)) errors.push({ rowNumber, field: component.name, message: `Score must be between 0 and ${component.maximumScore}.`, rawValue: raw });
        else rowGrades.push({ registrationId: registration.id, componentId: component.id, score });
      }
      if (errors.length === rowErrorCount) valid.push(...rowGrades);
    }
    const batch = await transaction.resultUploadBatch.create({ data: { courseOfferingId: offeringId, lecturerId, originalFilename: filename, status: errors.length ? UploadStatus.VALIDATED : UploadStatus.PROCESSED, errors: { create: errors.map(error => ({ ...error })) } } });
    for (const grade of valid) await transaction.assessmentScore.upsert({ where: { registrationId_assessmentComponentId: { registrationId: grade.registrationId, assessmentComponentId: grade.componentId } }, create: { registrationId: grade.registrationId, assessmentComponentId: grade.componentId, score: grade.score }, update: { score: grade.score } });
    return { batch, errors, validRows: new Set(valid.map(grade => grade.registrationId)).size };
  });
}

export async function submitLecturerResults(lecturerId: string, actorId: string, offeringId: string) {
  const roster = await getLecturerRoster(lecturerId, offeringId);
  return saveLecturerGrades(lecturerId, actorId, offeringId, roster.flatMap(registration => registration.assessmentScores.map(score => ({ registrationId: registration.id, componentId: score.assessmentComponentId, score: Number(score.score) }))), true);
}
