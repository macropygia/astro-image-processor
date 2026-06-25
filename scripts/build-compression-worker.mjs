import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const workersDir = path.join(root, '../src/api/workers');

await build({
  entryPoints: [path.join(workersDir, 'compressionWorker.ts')],
  outfile: path.join(workersDir, 'compressionWorker.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
});
