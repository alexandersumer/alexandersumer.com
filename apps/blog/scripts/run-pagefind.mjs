import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), '..');
const distDir = resolve(projectRoot, 'dist');

if (!existsSync(distDir)) {
  console.error(`Pagefind: expected build output at ${distDir}, but it was not found.`);
  process.exit(1);
}

const outputDir = resolve(distDir, 'pagefind');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const pagefindBin = resolve(projectRoot, 'node_modules', 'pagefind', 'lib', 'runner', 'bin.cjs');

const child = spawn(process.execPath, [pagefindBin, '--site', distDir, '--output-path', outputDir], {
  cwd: projectRoot,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Pagefind execution failed:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
