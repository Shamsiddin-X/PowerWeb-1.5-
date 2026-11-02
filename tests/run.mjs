import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { rawTextPlugin } from './support/raw-text.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const testsDirectory = join(root, 'tests');
const available = (await readdir(testsDirectory))
  .filter((name) => name.endsWith('.test.ts'))
  .sort();
const requested = process.argv.slice(2);
const suites = requested.length ? requested.map((name) => `${name}.test.ts`) : available;
const unknown = suites.filter((name) => !available.includes(name));
if (unknown.length) {
  console.error(
    `Unknown test suite: ${unknown.join(', ')}. Available: ${available.map((name) => basename(name, '.test.ts')).join(', ')}`,
  );
  process.exitCode = 1;
} else {
  const directory = await mkdtemp(join(testsDirectory, '.run-'));
  try {
    const outputs = [];
    for (const suite of [...new Set(suites)]) {
      const outfile = join(directory, suite.replace(/\.ts$/, '.mjs'));
      await build({
        absWorkingDir: root,
        entryPoints: [join(testsDirectory, suite)],
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'esm',
        outfile,
        plugins: [rawTextPlugin()],
      });
      outputs.push(outfile);
    }
    const child = spawn(process.execPath, ['--test', ...outputs], { cwd: root, stdio: 'inherit' });
    process.exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) => resolve(code ?? 1));
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
