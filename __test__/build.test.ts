import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

import { normalizeBuildHtml } from './normalizeBuildHtml.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');

const cleanBuildArtifacts = () => {
  const paths = [
    path.join(rootDir, 'dist'),
    path.join(rootDir, '.astro'),
    path.join(rootDir, 'node_modules/.astro/astro-image-processor'),
  ];
  for (const target of paths) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

describe('Integration/build', () => {
  test('build output matches snapshots', async () => {
    cleanBuildArtifacts();
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

    const readNormalized = (distPath: string) =>
      normalizeBuildHtml(fs.readFileSync(distPath, 'utf8'));

    await expect(readNormalized('__test__/dist/1/index.html')).toMatchFileSnapshot(
      './__snapshots__/1.html',
    );
    await expect(readNormalized('__test__/dist/2/index.html')).toMatchFileSnapshot(
      './__snapshots__/2.html',
    );
  }, 60_000);
});
