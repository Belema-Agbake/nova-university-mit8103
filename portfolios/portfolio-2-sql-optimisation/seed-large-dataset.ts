/**
 * Builds a repeatable 10,000-student benchmark dataset in a local database.
 * It never accepts a remote host or a database name other than the dedicated
 * nova_university_benchmark database. Run Prisma migrations and the normal
 * seed first so programme and offering reference rows already exist.
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const url = process.env.BENCHMARK_DATABASE_URL;
if (!url) throw new Error("BENCHMARK_DATABASE_URL is required.");
const target = new URL(url);
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname) || target.pathname !== "/nova_university_benchmark") {
  throw new Error("Large synthetic data may be generated only in local nova_university_benchmark.");
}

const database = new PrismaClient({ datasources: { db: { url } } });
const studentsToCreate = 10_000;
const batchSize = 500;

async function main() {
  const programme = await database.programme.findFirst({ where: { code: "BSC-CS" }, select: { id: true } });
  const offerings = await database.courseOffering.findMany({ take: 4, select: { id: true } });
  if (!programme || offerings.length < 4) {
    throw new Error("Seed the local benchmark database before generating synthetic students and registrations.");
  }

  for (let start = 0; start < studentsToCreate; start += batchSize) {
    const end = Math.min(start + batchSize, studentsToCreate);
    const users = Array.from({ length: end - start }, (_, offset) => {
      const number = start + offset + 1;
      return {
        id: `benchmark_user_${number}`,
        email: `benchmark.student.${number}@nova.example.test`,
        firstName: "Benchmark",
        lastName: `Student ${number}`,
        role: UserRole.STUDENT,
      };
    });
    await database.user.createMany({ data: users, skipDuplicates: true });
    await database.student.createMany({
      data: users.map((user, offset) => ({
        id: `benchmark_student_${start + offset + 1}`,
        userId: user.id,
        matriculationNumber: `BENCH/${String(start + offset + 1).padStart(5, "0")}`,
        programmeId: programme.id,
        entryYear: 2022 + ((start + offset) % 4),
        officialLevel: 100 + ((start + offset) % 4) * 100,
      })),
      skipDuplicates: true,
    });
    await database.registration.createMany({
      data: users.flatMap((_, offset) => {
        const studentId = `benchmark_student_${start + offset + 1}`;
        return offerings.map((offering) => ({ studentId, courseOfferingId: offering.id, status: "REGISTERED" as const }));
      }),
      skipDuplicates: true,
    });
    console.log(`Generated students ${start + 1}-${end}.`);
  }
  await database.$executeRawUnsafe("ANALYZE");
}

main().finally(() => database.$disconnect());
