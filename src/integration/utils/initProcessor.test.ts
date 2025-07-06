import { existsSync, rmdirSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { mockAstroConfig, mockLogger } from "#mock/mock.js";
import { initProcessor } from "./initProcessor.js";

describe("Unit/intergration/initProcessor", () => {
  test("default", async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: "__test__/image_cache_dir",
        downloadDirPattern: "__test__/download_dir",
      },
      config: mockAstroConfig,
      logger: mockLogger,
    });

    const { dirs } = ctx;
    const {
      rootDir,
      srcDir,
      publicDir,
      outDir,
      cacheDir,
      imageCacheDir,
      downloadDir,
    } = dirs;

    expect(rootDir).toBe("/mock/root/");
    expect(srcDir).toBe("/mock/root/src/");
    expect(publicDir).toBe("/mock/root/public/");
    expect(cacheDir).toBe("/mock/root/cache/");
    expect(imageCacheDir.endsWith("__test__/image_cache_dir/")).toBeTruthy();
    expect(downloadDir.endsWith("__test__/download_dir/")).toBeTruthy();
    expect(outDir).toBe("/mock/root/dist/");

    expect(existsSync(imageCacheDir)).toBeTruthy();
    expect(existsSync(downloadDir)).toBeTruthy();

    rmdirSync(imageCacheDir);
    rmdirSync(downloadDir);
  });
});
