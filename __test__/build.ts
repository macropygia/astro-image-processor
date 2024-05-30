import { type AstroInlineConfig, build } from "astro";
import { astroImageProcessor } from "../src/integration/index.js";

const baseConfig: AstroInlineConfig = {
  root: "__test__",
  output: "static",
  mode: "production",
};

const configs: AstroInlineConfig[] = [
  {
    ...baseConfig,
    outDir: "dist/1",
    integrations: [
      astroImageProcessor({
        imageOutDirPattern: "https://example.com/cdn/",
        disableCopy: true,
      }),
    ],
  },
  {
    ...baseConfig,
    outDir: "dist/2",
    scopedStyleStrategy: "class",
    integrations: [
      astroImageProcessor({
        preserveDirectories: true,
      }),
    ],
  },
];

export const buildTestConfigs = async () => {
  for (const config of configs) {
    await build(config);
  }
};
