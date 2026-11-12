import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const semesters = await prisma.semester.findMany({ where: { OR: [{ isCurrent: true }, { startDate: { gte: new Date("2025-01-01") } }] }, select: { id: true, isCurrent: true } });
  for (const semester of semesters) {
    await prisma.registrationPeriod.upsert({
      where: { id: `registration_window_${semester.id}` },
      update: { opensAt: new Date("2025-01-01T00:00:00.000Z"), closesAt: new Date("2027-01-01T23:59:59.000Z"), isActive: true },
      create: { id: `registration_window_${semester.id}`, semesterId: semester.id, opensAt: new Date("2025-01-01T00:00:00.000Z"), closesAt: new Date("2027-01-01T23:59:59.000Z"), isActive: true },
    });
  }
  console.log(`Registration windows updated: ${semesters.length}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
