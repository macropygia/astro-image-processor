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
      result: "402c95d164829d2c",
    },
    {
      processors: [undefined],
      result: "6b3e66fb0e6cb5fb",
    },
    {
      processors: [[sharp().grayscale(), sharp().negate()]],
      result: "5ed6b86ce1de8cd4",
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
