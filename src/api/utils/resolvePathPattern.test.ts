import { describe, expect, test, vi } from "vitest";

import type { ImgProcContextDirectories, ImgProcVariant } from "../../types.js";
import { resolvePathPattern } from "./resolvePathPattern.js";

const normalizePath = vi.fn((p: string) => p);

describe("Unit/api/utils/resolvePathPattern", () => {
  test("default", () => {
    const src = "/src/assets/images/image.png";
    const dirs = {
      rootDir: "/project/",
      srcDir: "/project/src/",
      outDir: "/project/dist/",
      imageCacheDir: "/project/cache/",
    } as ImgProcContextDirectories;
    const resolved = {
      width: 800,
      height: 600,
    };
    const item: ImgProcVariant = {
      hash: "1234567890abcdef",
      ext: "avif",
      descriptor: "2x",
      width: 1600,
      height: 1200,
      format: "avif",
    };

    normalizePath.mockImplementation((p: string) => p);

    expect(
      resolvePathPattern({
        src,
        fileNamePattern: "[name]_[width]x[height]@[descriptor].[ext]?[hash8]",
        dirs,
        resolved,
        item,
      }),
    ).toEqual({
      from: "/project/cache/1234567890abcdef.avif",
      to: "/project/dist/assets/images/image_800x600@2x.avif",
      toDir: "/project/dist/assets/images",
      toSrc: "/assets/images/image_800x600@2x.avif?12345678",
    });

    expect(
      resolvePathPattern({
        src,
        fileNamePattern: "[hash].[ext]",
        dirs,
        resolved,
        item,
      }),
    ).toEqual({
      from: "/project/cache/1234567890abcdef.avif",
      to: "/project/dist/assets/images/1234567890abcdef.avif",
      toDir: "/project/dist/assets/images",
      toSrc: "/assets/images/1234567890abcdef.avif",
    });
  });
});
