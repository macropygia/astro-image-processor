import { type Mock, beforeEach, describe, expect, test, vi } from "vitest";

import { generateVariant } from "./generateVariant.js";
import { generateVariants } from "./generateVariants.js";
import { retrieveVariant } from "./retrieveVariant.js";

vi.mock("sharp", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    toFormat: vi.fn().mockReturnThis(),
  })),
}));

vi.mock("p-limit", () => ({
  __esModule: true,
  default: vi.fn(() => (fn: any) => fn()),
}));

vi.mock("./retrieveVariant.js", () => ({
  retrieveVariant: vi.fn(),
}));

vi.mock("./generateVariant.js", () => ({
  generateVariant: vi.fn(),
}));

vi.mock("../utils/deterministicHash.js", () => ({
  deterministicHash: vi.fn(),
}));

vi.mock("../utils/getFilteredSharpOptions.js", () => ({
  getFilteredSharpOptions: vi.fn(),
}));

describe("Unit/api/methods/generateVariants", () => {
  const sourceMock: any = {
    db: {},
    dirs: { imageCacheDir: "cache/dir" },
    data: { hash: "sourceHash" },
    options: {
      src: "test.png",
      format: "webp",
      formats: ["avif", "webp"],
      processor: undefined,
    },
    formatOptions: {
      webp: {},
      avif: {},
    },
    resolved: {
      widths: [800, 1600],
      densities: [1, 2],
    },
    profile: "sourceProfile",
    componentType: "img",
    settings: { hasher: vi.fn() },
    getBuffer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should generate variants and retrieve from cache (componentType: img)", async () => {
    const cachedItem = {
      hash: "cachedHash",
      width: 800,
      height: 600,
      format: "webp",
      ext: "webp",
      descriptor: "1x",
    };

    (retrieveVariant as Mock).mockResolvedValueOnce(cachedItem);
    (retrieveVariant as Mock).mockResolvedValueOnce(null);

    (sourceMock.getBuffer as Mock).mockResolvedValue(
      Buffer.from("test buffer"),
    );

    const generatedItem = {
      hash: "generatedHash",
      width: 1600,
      height: 1200,
      format: "webp",
      ext: "webp",
      descriptor: "2x",
    };

    (generateVariant as Mock).mockResolvedValue(generatedItem);

    const result = await generateVariants(sourceMock);

    expect(retrieveVariant).toHaveBeenCalledTimes(2);
    expect(sourceMock.getBuffer).toHaveBeenCalledTimes(1);
    expect(generateVariant).toHaveBeenCalledTimes(1);

    expect(result.webp).toEqual([cachedItem, generatedItem]);
  });

  test("should generate variants for multiple formats (componentType: picture)", async () => {
    const sourceMockForMultipleFormats = {
      ...sourceMock,
      componentType: "picture",
    };

    const cachedItemWebp = {
      hash: "cachedHashWebp",
      width: 800,
      height: 600,
      format: "webp",
      ext: "webp",
      descriptor: "1x",
    };

    const generatedItemWebp = {
      hash: "generatedHashWebp",
      width: 1600,
      height: 1200,
      format: "webp",
      ext: "webp",
      descriptor: "2x",
    };

    const cachedItemAvif = {
      hash: "cachedHashAvif",
      width: 800,
      height: 600,
      format: "avif",
      ext: "avif",
      descriptor: "1x",
    };

    const generatedItemAvif = {
      hash: "generatedHashAvif",
      width: 1600,
      height: 1200,
      format: "avif",
      ext: "avif",
      descriptor: "2x",
    };

    (retrieveVariant as Mock)
      .mockResolvedValueOnce(cachedItemAvif)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(cachedItemWebp)
      .mockResolvedValueOnce(null);
    (sourceMock.getBuffer as Mock).mockResolvedValue(
      Buffer.from("test buffer"),
    );
    (generateVariant as Mock)
      .mockResolvedValueOnce(generatedItemAvif)
      .mockResolvedValueOnce(generatedItemWebp);

    const result = await generateVariants(sourceMockForMultipleFormats);

    expect(retrieveVariant).toHaveBeenCalledTimes(4);
    expect(sourceMock.getBuffer).toHaveBeenCalledTimes(2);
    expect(generateVariant).toHaveBeenCalledTimes(2);

    expect(result.webp).toEqual([cachedItemWebp, generatedItemWebp]);
    expect(result.avif).toEqual([cachedItemAvif, generatedItemAvif]);
  });

  test("should throw an error if source hash does not exist", async () => {
    const invalidSourceMock = {
      ...sourceMock,
      data: { hash: null },
    };

    await expect(generateVariants(invalidSourceMock)).rejects.toThrow(
      "Source hash does not exist",
    );
  });

  test("should sort the generated variants by width", async () => {
    const widthsSourceMock = {
      ...sourceMock,
      resolved: {
        widths: [800, 1600],
        densities: undefined,
      },
    };

    const generatedItem1 = {
      hash: "generatedHash1",
      width: 1600,
      height: 1200,
      format: "webp",
      ext: "webp",
      descriptor: "1600w",
    };

    const generatedItem2 = {
      hash: "generatedHash2",
      width: 800,
      height: 600,
      format: "webp",
      ext: "webp",
      descriptor: "800w",
    };

    (retrieveVariant as Mock).mockResolvedValue(null);
    (widthsSourceMock.getBuffer as Mock).mockResolvedValue(
      Buffer.from("test buffer"),
    );
    (generateVariant as Mock)
      .mockResolvedValueOnce(generatedItem1)
      .mockResolvedValueOnce(generatedItem2);

    const result = await generateVariants(widthsSourceMock);

    expect(result.webp).toEqual([generatedItem2, generatedItem1]);
  });
});
