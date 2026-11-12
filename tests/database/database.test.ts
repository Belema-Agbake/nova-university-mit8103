import { strict as assert } from "node:assert";
import { after, test } from "node:test";

import { loadEnvConfig } from "@next/env";
import { Prisma, PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is required for database integration tests.");
const parsedTestDatabaseUrl = new URL(testDatabaseUrl);
const databaseName = parsedTestDatabaseUrl.pathname.replace(/^\//, "");
if (!['localhost', '127.0.0.1', '::1'].includes(parsedTestDatabaseUrl.hostname) || databaseName !== "nova_university_test_isolated") {
  throw new Error("Database integration tests require the isolated local nova_university_test_isolated database.");
}

const database = new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } });
const expectDatabaseError = async (operation: Promise<unknown>, expected: string) => {
  await assert.rejects(operation, (error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === expected;
    return error instanceof Error && error.message.includes(expected);
  });
};

after(async () => database.$disconnect());

test("seed data is available and deterministic identities are unique", async () => {
  assert.equal(await database.student.count(), 3);
  assert.equal(await database.student.count({ where: { matriculationNumber: "STU/21/0821" } }), 1);
});

test("registration uniqueness prevents duplicate course registration", async () => {
  await expectDatabaseError(
    database.registration.create({ data: { id: "duplicate_registration", studentId: "student_1", courseOfferingId: "offering_course_csc401", status: "REGISTERED" } }),
    "P2002",
  );
});

test("foreign keys prevent registrations without a valid student", async () => {
  await expectDatabaseError(
    database.registration.create({ data: { id: "invalid_foreign_key", studentId: "does_not_exist", courseOfferingId: "offering_course_csc401", status: "REGISTERED" } }),
    "P2003",
  );
});

test("score trigger rejects a score above its assessment component maximum", async () => {
  await expectDatabaseError(
    database.assessmentScore.create({ data: { id: "score_too_high", registrationId: "registration_student_2_offering_course_csc401", assessmentComponentId: "component_offering_course_csc401_assignment", score: "21" } }),
    "Assessment score cannot exceed the component maximum",
  );
});

test("score trigger rejects components from another course offering", async () => {
  await expectDatabaseError(
    database.assessmentScore.create({ data: { id: "score_wrong_offering", registrationId: "registration_student_2_offering_course_csc401", assessmentComponentId: "component_offering_course_csc403_assignment", score: "10" } }),
    "An assessment score must use a component from the registered course offering",
  );
});

test("published results are immutable at the database boundary", async () => {
  await expectDatabaseError(
    database.result.update({ where: { id: "result_amina_csc401" }, data: { letterGrade: "B" } }),
    "Published results are immutable",
  );
});

test("registered course query returns a stable code ordering", async () => {
  const registrations = await database.registration.findMany({
    where: { studentId: "student_1", courseOffering: { semesterId: "semester_2025_2" }, status: "REGISTERED" },
    orderBy: { courseOffering: { course: { code: "asc" } } },
    select: { courseOffering: { select: { course: { select: { code: true } } } } },
  });
  assert.deepEqual(registrations.map((registration) => registration.courseOffering.course.code), ["CSC 401", "CSC 403", "CSC 405", "CSC 407"]);
});

test("course roster pagination produces a deterministic page", async () => {
  const roster = await database.registration.findMany({
    where: { courseOfferingId: "offering_course_csc401", status: "REGISTERED" },
    orderBy: { student: { matriculationNumber: "asc" } },
    skip: 1,
    take: 1,
    select: { student: { select: { matriculationNumber: true } } },
  });
  assert.deepEqual(roster.map((registration) => registration.student.matriculationNumber), ["STU/21/0828"]);
});

test("lecturer assignments are scoped to the requesting lecturer", async () => {
  const assignments = await database.lecturerAssignment.findMany({
    where: { lecturerId: "lecturer_michael", courseOffering: { semesterId: "semester_2025_2" } },
    select: { lecturerId: true, courseOfferingId: true },
  });
  assert.equal(assignments.length, 4);
  assert.ok(assignments.every((assignment) => assignment.lecturerId === "lecturer_michael"));
});

test("published-results read filters out draft records", async () => {
  const visibleResults = await database.result.findMany({ where: { status: "PUBLISHED" }, select: { id: true } });
  assert.deepEqual(visibleResults.map((result) => result.id), ["result_amina_csc401"]);
});

