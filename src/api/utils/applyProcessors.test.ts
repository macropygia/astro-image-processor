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
      result: "425ca4a131562767",
    },
    {
      processors: [undefined],
      result: "b46f21ccd3938fe3",
    },
    {
      processors: [[sharp().grayscale(), sharp().negate()]],
      result: "e71586db140f9c5a",
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
