import { readFileSync } from "node:fs";

import sharp from "sharp";
import { describe, expect, test } from "vitest";

import { xxHash3Hasher } from "../../extras/xxHash3Hasher.js";
import type { SharpWithOptions } from "../../types.js";
import { applyProcessors } from "./applyProcessors.js";
import { deterministicHash } from "./deterministicHash.js";

describe("Unit/api/utils/applyProcessors", () => {
  const buffer = readFileSync("__test__/src/assets/3000_gray.png");

  test.each([
    {
      processors: [sharp().grayscale()],
      result: "2730f8ddbb7ec66c",
    },
    {
      processors: [undefined],
      result: "5bc4586e75ddc11f",
    },
    {
      processors: [[sharp().grayscale(), sharp().negate()]],
      result: "a261e614b91a3e8a",
    },
  ])("default", ({ processors, result }) => {
    const resultSharp = applyProcessors({ processors, buffer });
    expect(
      deterministicHash(
        (resultSharp as SharpWithOptions).options,
        xxHash3Hasher,
      ),
    ).toBe(result);
  });
});
