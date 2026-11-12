import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const tsxCli = join(dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs');
const result = spawnSync(process.execPath, [tsxCli, '--test', 'tests/outbox/*.test.ts'], { stdio: 'inherit', env: process.env });
process.exitCode = result.status ?? 1;
