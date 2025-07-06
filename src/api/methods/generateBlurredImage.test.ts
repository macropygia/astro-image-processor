import { readFileSync } from "node:fs";

import sharp from "sharp";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { ImageSource } from "../ImageSource.js";
import { generateBlurredImage } from "../methods/generateBlurredImage.js";

describe("Unit/api/utils/generateBlurredImage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const baseSource = {
    db: {
      fetch: vi.fn(),
      insert: vi.fn(),
      renew: vi.fn(),
    },
    data: {
      hash: "mock-data-hash",
    },
    options: {
      blurProcessor: sharp().resize(1).webp({ quality: 1 }),
    },
    getBuffer: () => readFileSync("__test__/src/assets/3000_gray.png"),
    getSourceProfile: vi.fn().mockReturnValue(["mock-source-profile"]),
    settings: { hasher: () => "mock-hash" },
  } as unknown as ImageSource;

  test("succeeded", async () => {
    await expect(
      generateBlurredImage(baseSource),
    ).resolves.toMatchInlineSnapshot(
      `"data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADMDOJaQAA3AA5EAA"`,
    );
  });

  test("cache hit", async () => {
    const source = {
      ...baseSource,
      db: {
        fetch: () => ({
          format: "webp",
          base64: "mock-blurred-base64",
        }),
        insert: vi.fn(),
        renew: vi.fn(),
      },
    } as unknown as ImageSource;
    await expect(generateBlurredImage(source)).resolves.toMatchInlineSnapshot(
      `"data:image/webp;base64,mock-blurred-base64"`,
    );
  });

  test("with source processor", async () => {
    const source = {
      ...baseSource,
      options: {
        blurProcessor: sharp().resize(1).webp({ quality: 1 }),
        processor: [sharp().grayscale()],
      },
    } as ImageSource;

    await expect(generateBlurredImage(source)).resolves.toMatchInlineSnapshot(
      `"data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADMDOJaQAA3AA5EAA"`,
    );
  });

  test("throw", async () => {
    const source = {
      ...baseSource,
      data: {},
    } as ImageSource;

    await expect(() => generateBlurredImage(source)).rejects.toThrowError(
      "Source hash does not exist",
    );
  });
});
