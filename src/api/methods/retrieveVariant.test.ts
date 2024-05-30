import fs from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, test, vi } from "vitest";

import type { ImgProcDataAdapter } from "../../types.js";
import { retrieveVariant } from "./retrieveVariant.js";

const mockDb = {
  fetch: vi.fn(),
  renew: vi.fn(),
  delete: vi.fn(),
};

describe("Unit/api/methods/retrieveVariant", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  test("not found", async () => {
    mockDb.fetch.mockResolvedValue(null);

    const result = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
      variantDensity: 1,
    });

    expect(result).toBeNull();
  });

  test("cache exists and width matches", async () => {
    const variantData = {
      hash: "variantHash",
      format: "jpeg",
      width: 800,
      height: 600,
    };
    mockDb.fetch.mockResolvedValue(variantData);
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(path, "join").mockReturnValue("cache/dir/variantHash.jpg");

    const result = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
      variantDensity: 1,
    });

    expect(result).toEqual({
      hash: "variantHash",
      width: 800,
      height: 600,
      format: "jpeg",
      ext: "jpg",
      descriptor: "1x",
    });

    const resultWithoutDensity = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
    });

    expect(resultWithoutDensity).toEqual({
      hash: "variantHash",
      width: 800,
      height: 600,
      format: "jpeg",
      ext: "jpg",
      descriptor: "800w",
    });
  });

  test("delete record if cache file does not exist", async () => {
    const variantData = {
      hash: "variantHash",
      format: "jpeg",
      width: 800,
      height: 600,
    };
    mockDb.fetch.mockResolvedValue(variantData);
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    const result = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
      variantDensity: 1,
    });

    expect(result).toBeNull();
    expect(mockDb.delete).toHaveBeenCalledWith({
      profile: "variantProfileHash",
      source: "sourceHash",
    });
  });
});
