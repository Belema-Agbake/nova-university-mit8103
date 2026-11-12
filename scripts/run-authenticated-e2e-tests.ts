/** Seeds a local academic database, then runs signed-in browser tests through Firebase Auth Emulator. */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const configuredUrl = process.env.TEST_DATABASE_URL;
if (!configuredUrl) throw new Error("TEST_DATABASE_URL is required for role E2E tests.");
const target = new URL(configuredUrl);
if (!['localhost', '127.0.0.1', '::1'].includes(target.hostname)) throw new Error("Role E2E tests require a local PostgreSQL host.");
target.pathname = '/nova_university_test_isolated';
const environment = { ...process.env, DATABASE_URL: target.toString(), TEST_DATABASE_URL: target.toString(), FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR: 'true' };
const require = createRequire(import.meta.url);
const tsxCli = join(dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs');

function run(modulePath: string, args: string[]) {
  const result = spawnSync(process.execPath, [modulePath, ...args], { stdio: 'inherit', env: environment });
  if (result.error) throw result.error;
  console.log(`completed ${args.join(' ')} with status ${result.status}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(require.resolve('prisma/build/index.js'), ['migrate', 'deploy']);
const seed = spawnSync(process.execPath, [tsxCli, 'prisma/seed.ts'], { stdio: 'inherit', env: environment });
console.log(`completed seed with status ${seed.status}`);
if (seed.status !== 0) process.exit(seed.status ?? 1);
const firebaseCli = process.platform === 'win32'
  ? join(process.env.APPDATA ?? '', 'npm', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')
  : 'firebase';
const result = process.platform === 'win32'
  ? spawnSync(process.execPath, [firebaseCli, 'emulators:exec', '--only', 'auth', 'node scripts/run-role-browser-tests.mjs'], { stdio: 'inherit', env: environment })
  : spawnSync('firebase', ['emulators:exec', '--only', 'auth', 'node scripts/run-role-browser-tests.mjs'], { stdio: 'inherit', env: environment });
process.exitCode = result.status ?? 1;
