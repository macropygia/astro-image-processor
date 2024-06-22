import fs from "node:fs";
import path from "node:path";

import type { Sharp } from "sharp";
import { type Mock, afterAll, describe, expect, test, vi } from "vitest";

import type { Ora } from "ora";
import type { ImgProcDataAdapter } from "../../types.js";
import { applyProcessors } from "../utils/applyProcessors.js";
import { generateVariant } from "./generateVariant.js";

const mockDb = {
  insert: vi.fn(),
  fetch: vi.fn(),
};

const mockSpinner = {
  text: vi.fn(),
} as unknown as Ora;

vi.mock("../../const.js", () => ({
  extByFormat: {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    avif: "avif",
    heif: "avif",
    gif: "gif",
  },
}));

const mockHasher = vi.fn();
const mockVariantProcessor = {
  toBuffer: vi.fn(),
};
const mockSharpInstance = {
  metadata: vi.fn(),
  toBuffer: vi.fn(),
};

vi.mock("../utils/applyProcessors.js", () => ({
  applyProcessors: vi.fn(),
}));

vi.mock("../utils/resolveSharpFormat.js", () => ({
  resolveSharpFormat: vi.fn((format: string) => format),
}));

vi.mock("sharp", () => ({
  __esModule: true,
  default: vi.fn(() => mockSharpInstance),
}));

describe("Unit/api/methods/generateVariant", () => {
  afterAll(() => {
    // vi.clearAllMocks();
  });

  test("default", async () => {
    const buffer = Buffer.from("test buffer");
    const variantBuffer = Buffer.from("variant buffer");
    const variantHash = "variantHash";
    const variantMetadata = {
      format: "jpeg",
      width: 800,
      height: 600,
    };

    (applyProcessors as Mock).mockReturnValue(mockSharpInstance);
    mockSharpInstance.toBuffer.mockResolvedValue(variantBuffer);
    mockHasher.mockReturnValue(variantHash);
    mockSharpInstance.metadata.mockResolvedValue(variantMetadata);

    vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);

    const result = await generateVariant({
      src: "test.jpg",
      buffer,
      db: mockDb as unknown as ImgProcDataAdapter,
      hasher: mockHasher,
      imageCacheDir: "cache/dir",
      processor: undefined,
      variantProcessor: mockVariantProcessor as unknown as Sharp,
      variantProfileHash: "variantProfileHash",
      sourceHash: "sourceHash",
      variantWidth: 800,
      variantDensity: 1,
      spinner: mockSpinner,
    });

    expect(applyProcessors).toHaveBeenCalledWith({
      processors: [undefined, mockVariantProcessor],
      buffer,
    });
    expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    expect(mockHasher).toHaveBeenCalledWith(variantBuffer);
    expect(mockSharpInstance.metadata).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join("cache/dir", `${variantHash}.jpg`),
      variantBuffer,
    );
    expect(mockDb.insert).toHaveBeenCalledWith({
      hash: variantHash,
      category: "variant",
      format: "jpeg",
      width: 800,
      height: 600,
      source: "sourceHash",
      profile: "variantProfileHash",
    });
    expect(result).toEqual({
      hash: variantHash,
      width: 800,
      height: 600,
      format: "jpeg",
      ext: "jpg",
      descriptor: "1x",
    });

    const resultWithWidth = await generateVariant({
      src: "test.jpg",
      buffer,
      db: mockDb as unknown as ImgProcDataAdapter,
      hasher: mockHasher,
      imageCacheDir: "cache/dir",
      processor: undefined,
      variantProcessor: mockVariantProcessor as unknown as Sharp,
      variantProfileHash: "variantProfileHash",
      sourceHash: "sourceHash",
      variantWidth: 800,
      spinner: mockSpinner,
    });
    expect(resultWithWidth).toEqual({
      hash: variantHash,
      width: 800,
      height: 600,
      format: "jpeg",
      ext: "jpg",
      descriptor: "800w",
    });
  });

  test("throw", async () => {
    const buffer = Buffer.from("test buffer");
    const variantBuffer = Buffer.from("variant buffer");
    const variantHash = "variantHash";
    const variantMetadata = {
      format: "jpeg",
      width: 800,
      height: 600,
    };

    (applyProcessors as Mock).mockReturnValue(mockSharpInstance);
    mockSharpInstance.toBuffer.mockResolvedValue(variantBuffer);
    mockHasher.mockReturnValue(variantHash);
    mockSharpInstance.metadata.mockResolvedValue(variantMetadata);
    mockDb.insert.mockRejectedValue(new Error("DB insert error"));
    mockDb.fetch.mockResolvedValue({ profile: "oldProfileHash" });

    expect(() =>
      generateVariant({
        src: "test.jpg",
        buffer,
        db: mockDb as unknown as ImgProcDataAdapter,
        hasher: mockHasher,
        imageCacheDir: "cache/dir",
        processor: undefined,
        variantProcessor: mockVariantProcessor as unknown as Sharp,
        variantProfileHash: "variantProfileHash",
        sourceHash: "sourceHash",
        variantWidth: 800,
        variantDensity: 1,
        spinner: mockSpinner,
      }),
    ).rejects.toThrowError("DB insert error");
  });
});
