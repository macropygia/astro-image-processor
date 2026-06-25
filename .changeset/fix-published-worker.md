---
'astro-image-processor': patch
---

Fix Piscina worker failing in published packages by bundling `compressionWorker.js` for Node without `--experimental-strip-types` on `node_modules` paths.
