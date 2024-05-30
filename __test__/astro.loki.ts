import { defineConfig } from "astro/config";
import { LokiDataAdapter } from "../src/extras/LokiDataAdapter.js";
import { astroImageProcessor } from "../src/integration/index.js";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  root: "__test__",
  output: "static",
  integrations: [
    // @ts-ignore
    astroImageProcessor({
      dataAdapter: new LokiDataAdapter(),
    }),
  ],
});
