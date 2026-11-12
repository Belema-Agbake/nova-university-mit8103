/**
 * Creates no databases itself. It prepares and tests only the explicitly named
 * local disposable database, protecting developer and production databases.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const configuredUrl = process.env.TEST_DATABASE_URL;
if (!configuredUrl) throw new Error("TEST_DATABASE_URL is required to prepare isolated database tests.");
const target = new URL(configuredUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(target.hostname)) throw new Error("Isolated database tests require a local PostgreSQL host.");
target.pathname = "/nova_university_test_isolated";
const isolatedUrl = target.toString();
const environment = { ...process.env, DATABASE_URL: isolatedUrl, TEST_DATABASE_URL: isolatedUrl };
const require = createRequire(import.meta.url);
const tsxCli = join(dirname(require.resolve("tsx/package.json")), "dist", "cli.mjs");

function runNode(modulePath: string, args: string[]) {
  const result = spawnSync(process.execPath, [modulePath, ...args], { stdio: "inherit", env: environment });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runNode(require.resolve("prisma/build/index.js"), ["migrate", "deploy"]);
runNode(tsxCli, ["prisma/seed.ts"]);
runNode(tsxCli, ["--test", "tests/database/*.test.ts"]);
