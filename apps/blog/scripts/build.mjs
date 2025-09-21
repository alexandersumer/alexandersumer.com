import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), '..');
const astroBin = resolve(projectRoot, 'node_modules', '.bin', 'astro');

const run = (cmd, args, extraEnv = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...extraEnv,
      },
    });

    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });

console.log('Astro build script');
console.log(`  node executable : ${process.execPath}`);
console.log(`  project root    : ${projectRoot}`);
console.log(`  astro binary    : ${astroBin}`);
console.log(`  node_modules?   : ${existsSync(resolve(projectRoot, 'node_modules'))}`);

try {
  await run(process.execPath, [astroBin, 'build'], { ASTRO_TELEMETRY_DISABLED: '1' });
  await run(process.execPath, ['./scripts/run-pagefind.mjs']);
} catch (error) {
  console.error(error);
  process.exit(1);
}
