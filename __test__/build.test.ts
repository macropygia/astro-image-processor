import fs from "node:fs";

import { beforeAll, describe, expect, test } from "vitest";
import { buildTestConfigs } from "./build.js";

describe("Integration/build", () => {
  beforeAll(async () => {
    import.meta.env.MODE = "production";
    await buildTestConfigs();
  });

  test("case1", () => {
    expect(
      fs.readFileSync("__test__/dist/1/index.html").toString(),
    ).toMatchFileSnapshot("./__snapshots__/1.html");
  });

  test("case2", () => {
    expect(
      fs.readFileSync("__test__/dist/2/index.html").toString(),
    ).toMatchFileSnapshot("./__snapshots__/2.html");
  });
});
