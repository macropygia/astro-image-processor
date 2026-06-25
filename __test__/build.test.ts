import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');

describe('Integration/build', () => {
  test('build output matches snapshots', async () => {
    const cleanEnv = {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      NODE_ENV: 'production',
      CI: 'true',
    };
    execSync('pnpm exec astro build --config astro.build1.ts --root __test__', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: cleanEnv,
    });
    execSync('pnpm exec astro build --config astro.build2.ts --root __test__', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: cleanEnv,
    });

    await expect(fs.readFileSync('__test__/dist/1/index.html').toString()).toMatchFileSnapshot(
      './__snapshots__/1.html',
    );
    await expect(fs.readFileSync('__test__/dist/2/index.html').toString()).toMatchFileSnapshot(
      './__snapshots__/2.html',
    );
  }, 60_000);
});
