import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const tsxCli = join(dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs');
let result = spawnSync(process.execPath, [tsxCli, 'tests/auth/emulator-seed.ts'], { stdio: 'inherit', env: process.env });
if (result.status !== 0) process.exit(result.status ?? 1);
const playwright = require.resolve('@playwright/test/cli');
result = spawnSync(process.execPath, [playwright, 'test', 'tests/e2e/authenticated-roles.spec.ts'], { stdio: 'inherit', env: process.env });
process.exitCode = result.status ?? 1;
