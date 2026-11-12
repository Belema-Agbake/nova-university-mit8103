/**
 * Read-only schema verification. It is deliberately opt-in and checks only
 * migration metadata and the outbox table; it never applies a migration.
 */
import { PrismaClient } from "@prisma/client";

if (process.env.ALLOW_READ_ONLY_SCHEMA_CHECK !== "true") {
  throw new Error("Set ALLOW_READ_ONLY_SCHEMA_CHECK=true after approving a read-only environment check.");
}

const database = new PrismaClient();
try {
  const [migrationCount, outboxExists] = await Promise.all([
    database.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"`,
    database.$queryRaw<Array<{ exists: boolean }>>`SELECT to_regclass('public.academic_event_outbox') IS NOT NULL AS exists`,
  ]);
  console.log(JSON.stringify({ migrationCount: Number(migrationCount[0]?.count ?? 0), academicEventOutboxPresent: outboxExists[0]?.exists === true }));
} finally {
  await database.$disconnect();
}
