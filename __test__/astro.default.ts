import { defineConfig } from "astro/config";
import { astroImageProcessor } from "../src/integration/index.js";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  root: "__test__",
  output: "static",
  // scopedStyleStrategy: "class",
  integrations: [
    // @ts-ignore
    astroImageProcessor({
      preserveDirectories: true,
      componentProps: {
        objectFit: "cover",
      },
    }),
  ],
});
