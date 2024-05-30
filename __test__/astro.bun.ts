import { defineConfig } from "astro/config";
import { BunSqliteDataAdapter } from "../src/extras/BunSqliteDataAdapter.js";
import { astroImageProcessor } from "../src/integration/index.js";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  root: "__test__",
  output: "static",
  integrations: [
    // @ts-ignore
    astroImageProcessor({
      dataAdapter: new BunSqliteDataAdapter(),
    }),
  ],
});
