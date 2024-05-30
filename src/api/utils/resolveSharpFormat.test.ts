import type { FormatEnum } from "sharp";
import { describe, expect, test } from "vitest";

import { resolveSharpFormat } from "./resolveSharpFormat.js";

describe("Unit/api/utils/resolveSharpFormat", () => {
  test.each<{
    sharp: keyof FormatEnum;
    compression?: string;
    format: string;
  }>([
    {
      sharp: "heif",
      compression: "av1",
      format: "avif",
    },
    {
      sharp: "heif",
      compression: "hevc",
      format: "heic",
    },
    {
      sharp: "png",
      format: "png",
    },
    {
      sharp: "jpeg",
      format: "jpeg",
    },
    {
      sharp: "webp",
      format: "webp",
    },
    {
      sharp: "gif",
      format: "gif",
    },
  ])("default", ({ sharp, compression, format }) => {
    expect(resolveSharpFormat(sharp, compression)).toBe(format);
  });

  test("throw", () => {
    expect(() => resolveSharpFormat("svg")).toThrowError(
      "SVG is not supported",
    );
  });
});
