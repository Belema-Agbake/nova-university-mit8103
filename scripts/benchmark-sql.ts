/** Captures repeated local-only PostgreSQL execution-plan timings. */
import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const databaseUrl = process.env.BENCHMARK_DATABASE_URL;
if (!databaseUrl) throw new Error('BENCHMARK_DATABASE_URL is required.');
const target = new URL(databaseUrl);
if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname) || target.pathname !== '/nova_university_benchmark') throw new Error('SQL benchmarks may run only against local nova_university_benchmark.');

const database = new PrismaClient({ datasources: { db: { url: target.toString() } } });
const repetitions = 11;
const warmupRuns = 1;
const outputDirectory = resolve('portfolios/portfolio-2-sql-optimisation/explain-results');
const queries = [
  ['Q1 student registered courses', `SELECT r.id, c.code, c.title, r.status FROM registrations r JOIN course_offerings co ON co.id = r."courseOfferingId" JOIN courses c ON c.id = co."courseId" WHERE r."studentId" = 'benchmark_student_1' AND co."semesterId" = 'semester_2025_2' AND r.status IN ('PENDING', 'REGISTERED') ORDER BY c.code`],
  ['Q2 available course offerings', `SELECT co.id, c.code, c.title, c.level FROM course_offerings co JOIN courses c ON c.id = co."courseId" WHERE co."semesterId" = 'semester_2025_2' AND co."programmeId" = 'prog_bsc_cs' AND c.level <= 400 ORDER BY c.code`],
  ['Q3 lecturer assigned courses', `SELECT la.id, co.id, c.code FROM lecturer_assignments la JOIN course_offerings co ON co.id = la."courseOfferingId" JOIN courses c ON c.id = co."courseId" WHERE la."lecturerId" = 'lecturer_michael' AND co."semesterId" = 'semester_2025_2' ORDER BY c.code`],
  ['Q4 lecturer course roster', `SELECT r.id, s."matriculationNumber" FROM registrations r JOIN students s ON s.id = r."studentId" WHERE r."courseOfferingId" = 'offering_course_csc401' AND r.status = 'REGISTERED' ORDER BY s."matriculationNumber" LIMIT 50 OFFSET 0`],
  ['Q5 administrator pending result approvals', `SELECT r.id, r.status, r."submittedAt" FROM results r JOIN registrations reg ON reg.id = r."registrationId" WHERE r.status IN ('SUBMITTED', 'CHANGES_REQUESTED') ORDER BY r."submittedAt", r.id LIMIT 50`],
  ['Q6 student published results', `SELECT r.id, r."totalScore", r."letterGrade", r."gradePoint" FROM results r JOIN registrations reg ON reg.id = r."registrationId" WHERE r.status = 'PUBLISHED' AND reg."studentId" = 'student_1' ORDER BY r."publishedAt" DESC`],
  ['Q7 outbox pending delivery queue', `SELECT id, "recipientFirebaseUid", attempts, "availableAt" FROM academic_event_outbox WHERE status IN ('PENDING', 'FAILED') AND "availableAt" <= NOW() ORDER BY "availableAt", "createdAt", id LIMIT 100`],
] as const;

function percentile(sorted: number[], quantile: number) { const index = (sorted.length - 1) * quantile; const lower = Math.floor(index); const upper = Math.ceil(index); return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower); }
function planValue(result: unknown) { const row = Array.isArray(result) ? result[0] as Record<string, unknown> | undefined : undefined; return row?.['QUERY PLAN'] ?? row?.query_plan ?? result; }

async function main() {
  mkdirSync(outputDirectory, { recursive: true });
  await database.$executeRawUnsafe('ANALYZE');
  const results: Array<{ query: string; samplesMs: number[]; medianMs: number; p95Ms: number; plan: unknown }> = [];
  for (const [query, sql] of queries) {
    const samples: number[] = [];
    let plan: unknown = null;
    for (let run = 0; run < repetitions + warmupRuns; run += 1) {
      const started = performance.now();
      const rawPlan = await database.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
      if (run === warmupRuns) plan = planValue(rawPlan);
      if (run >= warmupRuns) samples.push(Number((performance.now() - started).toFixed(3)));
    }
    const sorted = [...samples].sort((left, right) => left - right);
    results.push({ query, samplesMs: samples, medianMs: Number(percentile(sorted, 0.5).toFixed(3)), p95Ms: Number(percentile(sorted, 0.95).toFixed(3)), plan });
  }
  const createdAt = new Date().toISOString();
  const report = { createdAt, database: target.pathname.slice(1), syntheticStudents: 10_000, warmupRuns, measuredRuns: repetitions, results };
  const stamp = createdAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
  writeFileSync(resolve(outputDirectory, `benchmark-median-p95-${stamp}.json`), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = ['# Repeated SQL benchmark results', '', `- Database: \`${report.database}\` (local, fictional data only)`, `- Dataset: ${report.syntheticStudents.toLocaleString()} synthetic students`, `- Method: ${warmupRuns} warm-up plus ${repetitions} measured EXPLAIN ANALYZE runs per query`, '', '| Query | Median (ms) | P95 (ms) |', '| --- | ---: | ---: |', ...results.map((result) => `| ${result.query} | ${result.medianMs.toFixed(3)} | ${result.p95Ms.toFixed(3)} |`), '', 'The matching JSON file contains execution-plan output and individual timing samples.', ''].join('\n');
  writeFileSync(resolve(outputDirectory, `benchmark-median-p95-${stamp}.md`), markdown);
  console.table(results.map(({ query, medianMs, p95Ms }) => ({ query, medianMs, p95Ms })));
}

main().finally(() => database.$disconnect());
