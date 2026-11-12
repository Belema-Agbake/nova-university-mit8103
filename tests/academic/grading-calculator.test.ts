import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateAcademicResults, degreeClassification, gradeForScore, type AcademicAttempt } from "../../src/server/academic/grading-calculator";

test("all six grade boundaries use the five-point scale", () => {
  assert.deepEqual([0, 39, 40, 44, 45, 49, 50, 59, 60, 69, 70, 100].map(score => gradeForScore(score).letter), ["F", "F", "E", "E", "D", "D", "C", "C", "B", "B", "A", "A"]);
});

test("GPA excludes unpublished/incomplete attempts and counts failures", () => {
  const attempts: AcademicAttempt[] = [
    { courseId: "a", courseCode: "CSC 101", courseTitle: "Introduction to Computer Science", level: 100, semesterId: "s", creditUnits: 3, score: 80, published: true, complete: true },
    { courseId: "b", courseCode: "CSC 102", courseTitle: "Introduction to Programming with Python", level: 100, semesterId: "s", creditUnits: 2, score: 20, published: true, complete: true },
    { courseId: "c", courseCode: "CSC 103", courseTitle: "Hidden Draft", level: 100, semesterId: "s", creditUnits: 3, score: 100, published: false, complete: true },
  ];
  const result = calculateAcademicResults(attempts);
  assert.equal(result.attemptedUnits, 5);
  assert.equal(result.qualityPoints, 15);
  assert.equal(result.gpa, 3);
});

test("retakes preserve history while using the latest active attempt", () => {
  const result = calculateAcademicResults([
    { courseId: "a", courseCode: "CSC 101", courseTitle: "Introduction to Computer Science", level: 100, semesterId: "s1", creditUnits: 3, score: 35, published: true, complete: true, attemptNumber: 1 },
    { courseId: "a", courseCode: "CSC 101", courseTitle: "Introduction to Computer Science", level: 100, semesterId: "s2", creditUnits: 3, score: 75, published: true, complete: true, attemptNumber: 2 },
  ]);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0]?.letterGrade, "A");
  assert.equal(result.attempts[0]?.isRetake, true);
  assert.equal(result.gpa, 5);
});

test("degree classification uses full precision thresholds", () => {
  assert.equal(degreeClassification(4.49999), "Second Class Upper");
  assert.equal(degreeClassification(4.5), "First Class Honours");
  assert.equal(degreeClassification(0.99), "Below Minimum Classification Threshold");
});

test("five-level deterministic fixture produces the required cumulative totals", () => {
  const attempts: AcademicAttempt[] = [];
  const add = (level: number, units: number, score: number, prefix: string) => { for (let index = 0; index < units; index += 1) attempts.push({ courseId: `${prefix}-${index}`, courseCode: `${prefix} ${index}`, courseTitle: `Fixture ${prefix} ${index}`, level, semesterId: `${level}`, creditUnits: 1, score, published: true, complete: true }); };
  add(100, 20, 70, "L100A"); add(100, 4, 0, "L100F");
  add(200, 4, 70, "L200A"); add(200, 21, 60, "L200B");
  add(300, 20, 70, "L300A"); add(300, 4, 60, "L300B"); add(300, 2, 0, "L300F");
  add(400, 20, 70, "L400A"); add(400, 6, 60, "L400B");
  add(500, 16, 70, "L500A"); add(500, 3, 60, "L500B");
  const result = calculateAcademicResults(attempts);
  assert.equal(result.attemptedUnits, 120);
  assert.equal(result.qualityPoints, 536);
  assert.equal(result.gpa, 536 / 120);
  assert.equal(result.classification, "Second Class Upper");
});
