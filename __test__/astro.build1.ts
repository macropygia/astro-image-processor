import { defineConfig } from 'astro/config';

import { astroImageProcessor } from '../src/integration/index.js';

// biome-ignore lint/style/noDefaultExport: test config
export default defineConfig({
  root: '__test__',
  output: 'static',
  outDir: 'dist/1',
  integrations: [
    astroImageProcessor({
      imageOutDirPattern: 'https://example.com/cdn/',
      disableCopy: true,
    }),
  ],
});
