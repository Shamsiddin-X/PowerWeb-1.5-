import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const dir = await mkdtemp(join(process.cwd(), 'tests', '.run-'));
try {
  await build({ entryPoints: ['tests/regression.test.ts'], bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: join(dir, 'suite.mjs') });
  const child = spawn(process.execPath, [join(dir, 'suite.mjs')], { stdio: 'inherit' });
  process.exitCode = await new Promise(resolve => child.on('exit', code => resolve(code ?? 1)));
} finally { await rm(dir, { recursive: true, force: true }); }
