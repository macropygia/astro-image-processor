import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import { coverageConfigDefaults, defaultExclude } from "vitest/config";
// import { getViteConfig } from "astro/config";

// biome-ignore lint/style/noDefaultExport: Required
export default defineConfig({
  test: {
    exclude: [
      ...defaultExclude,
      // Add
      "**/bun*",
    ],
    coverage: {
      provider: "v8",
      extension: [".ts"],
      include: ["src"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        // Add
        "**/Bun*",
        "**/bun*",
        "**/src/extras/index.ts", // only exports
        "**/src/components/index.ts", // only exports
        "**/src/components/exports.ts", // only exports
      ],
      reporter: ["html", "json"],
    },
    alias: {
      "#test": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./__test__/src",
      ),
      "#mock": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./__mock__/",
      ),
    },
  },
});
