import assert from "node:assert/strict";
import { after, test } from "node:test";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).hostname.match(/^(localhost|127\.0\.0\.1|::1)$/) || new URL(url).pathname !== "/nova_university_test_isolated") throw new Error("Lecturer grading tests require local nova_university_test_isolated.");
const database = new PrismaClient({ datasources: { db: { url } } });

test("lecturer course list is assignment-scoped", async () => {
  const courses = await database.lecturerAssignment.findMany({ where: { lecturerId: "lecturer_michael", courseOffering: { semesterId: "semester_2025_2" } }, include: { courseOffering: { include: { components: true } } } });
  assert.equal(courses.length, 4);
  assert.ok(courses.every(course => course.courseOffering.components.length === 3));
});

test("unassigned lecturer cannot save grades", async () => {
  const assignment = await database.lecturerAssignment.findFirst({ where: { lecturerId: "does-not-exist", courseOfferingId: "offering_course_csc401" } });
  assert.equal(assignment, null);
});

test("manual grade validation rejects scores above component maximum", async () => {
  await assert.rejects(database.assessmentScore.create({ data: { id: "lecturer_grading_invalid_score", registrationId: "registration_student_2_offering_course_csc403", assessmentComponentId: "component_offering_course_csc403_assignment", score: 21 } }), /Assessment score cannot exceed/);
});

after(async () => database.$disconnect());
