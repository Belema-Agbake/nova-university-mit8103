import assert from "node:assert/strict";
import { after, test } from "node:test";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
loadEnvConfig(process.cwd());
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).hostname.match(/^(localhost|127\.0\.0\.1|::1)$/) || new URL(url).pathname !== "/nova_university_test_isolated") throw new Error("Administrator review tests require local nova_university_test_isolated.");
const database = new PrismaClient({ datasources: { db: { url } } });
test("review queue includes submitted results but excludes drafts and published results", async () => {
  const queue = await database.result.findMany({ where: { status: { in: ["SUBMITTED", "CHANGES_REQUESTED"] } }, select: { id: true, status: true } });
  assert.ok(queue.every(result => result.status === "SUBMITTED" || result.status === "CHANGES_REQUESTED"));
  assert.ok(!queue.some(result => result.id === "result_draft" || result.id === "result_amina_csc401"));
});
test("published result cannot be edited by the review queue", async () => {
  const result = await database.result.findUniqueOrThrow({ where: { id: "result_amina_csc401" } });
  assert.equal(result.status, "PUBLISHED");
});
after(async () => database.$disconnect());
