import { writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { Prisma, PrismaClient, RegistrationStatus, ResultStatus } from "@prisma/client";

loadEnvConfig(process.cwd());
const configuredUrl = process.env.TEST_DATABASE_URL;
if (!configuredUrl || !configuredUrl.includes("localhost") || !configuredUrl.includes("nova_university_test")) throw new Error("This benchmark only permits local nova_university_test.");
const databaseUrl = configuredUrl.includes("connection_limit=") ? configuredUrl : `${configuredUrl}&connection_limit=30`;
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const prefix = `benchmark_${Date.now()}`;
const clock = () => process.hrtime.bigint();
type Outcome = { ok: boolean; retries: number; error?: string };
type Result = { name: string; concurrency: number; successes: number; failures: number; retries: number; averageLatencyMs: number; p95LatencyMs: number; throughputPerSecond: number; integrity: string };

function errorMessage(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError ? `${error.code}: ${error.message.split("\n")[0]}` : error instanceof Error ? error.message : String(error); }
async function withRetry(operation: () => Promise<void>, maxRetries = 50): Promise<Outcome> {
  let retries = 0;
  while (true) { try { await operation(); return { ok: true, retries }; } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && retries < maxRetries) { retries += 1; continue; } return { ok: false, retries, error: errorMessage(error) }; } }
}
async function concurrent(name: string, concurrency: number, operation: (index: number) => Promise<Outcome>): Promise<Result> {
  const started = clock(); const latencies: number[] = [];
  const outcomes = await Promise.all(Array.from({ length: concurrency }, async (_, index) => { const begin = clock(); const value = await operation(index); latencies.push(Number(clock() - begin) / 1e6); return value; }));
  const elapsed = Number(clock() - started) / 1e9; latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * .95) - 1)] ?? 0;
  const failures = outcomes.filter((x) => !x.ok);
  return { name, concurrency, successes: outcomes.filter((x) => x.ok).length, failures: failures.length, retries: outcomes.reduce((sum, outcome) => sum + outcome.retries, 0), averageLatencyMs: Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3)), p95LatencyMs: Number(p95.toFixed(3)), throughputPerSecond: Number((outcomes.length / elapsed).toFixed(3)), integrity: "verified" };
}
async function registered(offeringId: string) { return prisma.registration.count({ where: { courseOfferingId: offeringId, status: RegistrationStatus.REGISTERED } }); }

async function cleanup() {
  await prisma.$transaction(async (tx) => {
    await tx.resultAuditHistory.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.result.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.assessmentScore.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.assessmentComponent.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.registration.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.courseOffering.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.course.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.academicSetting.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.student.deleteMany({ where: { id: { startsWith: prefix } } });
    await tx.user.deleteMany({ where: { id: { startsWith: prefix } } });
  });
}

async function main() {
  const programme = await prisma.programme.findUniqueOrThrow({ where: { id: "prog_bsc_cs" } });
  const users = await Promise.all(Array.from({ length: 20 }, (_, i) => prisma.user.create({ data: { id: `${prefix}_user_${i}`, email: `${prefix}_${i}@nova.test`, firstName: "Benchmark", lastName: `Student ${i}`, role: "STUDENT", accountStatus: "ACTIVE", firebaseUid: `${prefix}_firebase_${i}` } })));
  const students = await Promise.all(users.map((user, i) => prisma.student.create({ data: { id: `${prefix}_student_${i}`, userId: user.id, matriculationNumber: `${prefix}/STU/${i}`, programmeId: programme.id, entryYear: 2026, officialLevel: 400 } })));
  const course = await prisma.course.create({ data: { id: `${prefix}_course`, departmentId: programme.departmentId, code: `${prefix} 401`, title: "Concurrency Benchmark", creditUnits: 3, level: 400 } });
  const gradeCourse = await prisma.course.create({ data: { id: `${prefix}_grade_course`, departmentId: programme.departmentId, code: `${prefix} 402`, title: "Grade Concurrency Benchmark", creditUnits: 3, level: 400 } });
  const lastSeat = await prisma.courseOffering.create({ data: { id: `${prefix}_last`, courseId: course.id, semesterId: "semester_2025_2", programmeId: programme.id, capacity: 1 } });
  const serial = await prisma.courseOffering.create({ data: { id: `${prefix}_serial`, courseId: course.id, semesterId: "semester_2025_1", programmeId: programme.id, capacity: 5 } });
  const duplicate = await prisma.courseOffering.create({ data: { id: `${prefix}_duplicate`, courseId: course.id, semesterId: "semester_2024_2", programmeId: programme.id, capacity: 20 } });
  const gradeOffering = await prisma.courseOffering.create({ data: { id: `${prefix}_grade`, courseId: gradeCourse.id, semesterId: "semester_2025_2", programmeId: programme.id, capacity: 20 } });
  const gradeRegistration = await prisma.registration.create({ data: { id: `${prefix}_grade_reg`, studentId: students[0].id, courseOfferingId: gradeOffering.id, status: "REGISTERED" } });
  const component = await prisma.assessmentComponent.create({ data: { id: `${prefix}_component`, courseOfferingId: gradeOffering.id, name: "Benchmark", weightPercent: 100, maximumScore: 100 } });
  const score = await prisma.assessmentScore.create({ data: { id: `${prefix}_score`, registrationId: gradeRegistration.id, assessmentComponentId: component.id, score: 0 } });
  const pubRegistration = await prisma.registration.create({ data: { id: `${prefix}_pub_reg`, studentId: students[1].id, courseOfferingId: gradeOffering.id, status: "REGISTERED" } });
  const pubResult = await prisma.result.create({ data: { id: `${prefix}_pub_result`, registrationId: pubRegistration.id, status: ResultStatus.DRAFT } });
  await prisma.assessmentScore.create({ data: { id: `${prefix}_pub_score`, registrationId: pubRegistration.id, assessmentComponentId: component.id, score: 75 } });
  const setting = await prisma.academicSetting.create({ data: { id: `${prefix}_setting`, key: `${prefix}_rollback`, value: { state: "before" } } });
  const results: Result[] = [];

  results.push(await concurrent("last available course seat", 20, async (i) => { try { await prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM course_offerings WHERE id = ${lastSeat.id} FOR UPDATE`; if (await tx.registration.count({ where: { courseOfferingId: lastSeat.id, status: "REGISTERED" } }) >= 1) throw new Error("COURSE_AT_CAPACITY"); await tx.registration.create({ data: { id: `${prefix}_last_reg_${i}`, studentId: students[i].id, courseOfferingId: lastSeat.id, status: "REGISTERED" } }); }); return { ok: true, retries: 0 }; } catch (error) { return { ok: false, retries: 0, error: errorMessage(error) }; } }));
  if (await registered(lastSeat.id) !== 1) throw new Error("last-seat integrity failed");

  results.push(await concurrent("duplicate registration", 20, async (i) => { try { await prisma.registration.create({ data: { id: `${prefix}_dup_reg_${i}`, studentId: students[0].id, courseOfferingId: duplicate.id, status: "REGISTERED" } }); return { ok: true, retries: 0 }; } catch (error) { return { ok: false, retries: 0, error: errorMessage(error) }; } }));
  if (await prisma.registration.count({ where: { studentId: students[0].id, courseOfferingId: duplicate.id } }) !== 1) throw new Error("duplicate-registration integrity failed");

  const drop = await prisma.registration.create({ data: { id: `${prefix}_drop_reg`, studentId: students[2].id, courseOfferingId: duplicate.id, status: "REGISTERED" } });
  results.push(await concurrent("concurrent course dropping", 20, async () => { const updated = await prisma.registration.updateMany({ where: { id: drop.id, status: "REGISTERED" }, data: { status: "DROPPED" } }); return { ok: updated.count === 1, retries: 0, error: updated.count === 1 ? undefined : "ALREADY_DROPPED" }; }));
  if ((await prisma.registration.findUniqueOrThrow({ where: { id: drop.id } })).status !== "DROPPED") throw new Error("drop integrity failed");

  const before = await prisma.academicSetting.findUniqueOrThrow({ where: { id: setting.id } });
  const rollbackResult = await concurrent("transaction rollback", 1, async () => { try { await prisma.$transaction(async (tx) => { await tx.academicSetting.update({ where: { id: setting.id }, data: { value: { state: "rollback" } } }); throw new Error("intentional rollback"); }); return { ok: false, retries: 0, error: "rollback unexpectedly committed" }; } catch { return { ok: true, retries: 0 }; } });
  const after = await prisma.academicSetting.findUniqueOrThrow({ where: { id: setting.id } });
  if (JSON.stringify(before.value) !== JSON.stringify(after.value)) throw new Error("rollback integrity failed");
  results.push(rollbackResult);

  results.push(await concurrent("row locking", 20, async () => { try { await prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM course_offerings WHERE id = ${lastSeat.id} FOR UPDATE`; await tx.$executeRaw`UPDATE course_offerings SET capacity = capacity WHERE id = ${lastSeat.id}`; }); return { ok: true, retries: 0 }; } catch (error) { return { ok: false, retries: 0, error: errorMessage(error) }; } }));
  if ((await prisma.courseOffering.findUniqueOrThrow({ where: { id: lastSeat.id } })).capacity !== 1) throw new Error("row-lock integrity failed");

  results.push(await concurrent("serializable retries", 20, async (i) => withRetry(async () => prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM course_offerings WHERE id = ${serial.id} FOR UPDATE`; if (await tx.registration.count({ where: { courseOfferingId: serial.id, status: "REGISTERED" } }) >= 5) throw new Error("COURSE_AT_CAPACITY"); await tx.registration.create({ data: { id: `${prefix}_serial_reg_${i}`, studentId: students[i].id, courseOfferingId: serial.id, status: "REGISTERED" } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))));
  if (await registered(serial.id) !== 5) throw new Error("serializable integrity failed");

  results.push(await concurrent("concurrent grade updates", 20, async () => withRetry(async () => prisma.$transaction(async (tx) => { const row = await tx.assessmentScore.findUniqueOrThrow({ where: { id: score.id } }); await tx.assessmentScore.update({ where: { id: row.id }, data: { score: Number(row.score) + 1 } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))));
  if (Number((await prisma.assessmentScore.findUniqueOrThrow({ where: { id: score.id } })).score) !== 20) throw new Error("grade integrity failed");

  results.push(await concurrent("result publication consistency", 20, async () => withRetry(async () => prisma.$transaction(async (tx) => { const updated = await tx.result.updateMany({ where: { id: pubResult.id, status: ResultStatus.DRAFT }, data: { status: ResultStatus.PUBLISHED, publishedAt: new Date(), totalScore: 75, letterGrade: "A", gradePoint: 5 } }); if (updated.count !== 1) throw new Error("ALREADY_PUBLISHED"); await tx.resultAuditHistory.create({ data: { id: `${prefix}_audit_${Math.random().toString(36).slice(2)}`, resultId: pubResult.id, action: "PUBLISHED", details: { source: "benchmark" } } }); }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))));
  const published = await prisma.result.findUniqueOrThrow({ where: { id: pubResult.id }, include: { audits: true } });
  if (published.status !== ResultStatus.PUBLISHED || published.audits.length !== 1) throw new Error(`publication integrity failed: status=${published.status}, audits=${published.audits.length}`);

  writeFileSync("portfolios/portfolio-3-transactions-concurrency/results.json", JSON.stringify({ database: "nova_university_test", generatedAt: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await cleanup();
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { try { await cleanup(); } catch (cleanupError) { console.error(cleanupError); } finally { await prisma.$disconnect(); } });
