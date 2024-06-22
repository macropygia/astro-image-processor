import path from "node:path";

import { type Mock, afterAll, describe, expect, test, vi } from "vitest";

import type { Ora } from "ora";
import type { ImgProcDataAdapter } from "../../types.js";
import { pathExists } from "../utils/pathExists.js";
import { retrieveVariant } from "./retrieveVariant.js";

const mockDb = {
  fetch: vi.fn(),
  renew: vi.fn(),
  delete: vi.fn(),
};

const mockSpinner = {
  text: vi.fn(),
} as unknown as Ora;

vi.mock("../utils/pathExists.js");

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
      spinner: mockSpinner,
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
    // vi.spyOn(fs, "existsSync").mockReturnValue(true);
    (pathExists as Mock).mockResolvedValue(true);
    vi.spyOn(path, "join").mockReturnValue("cache/dir/variantHash.jpg");

    const result = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
      variantDensity: 1,
      spinner: mockSpinner,
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
      spinner: mockSpinner,
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
    // vi.spyOn(fs, "existsSync").mockReturnValue(false);
    (pathExists as Mock).mockResolvedValue(false);

    const result = await retrieveVariant({
      src: "test.jpg",
      db: mockDb as unknown as ImgProcDataAdapter,
      sourceHash: "sourceHash",
      variantProfileHash: "variantProfileHash",
      imageCacheDir: "cache/dir",
      variantWidth: 800,
      variantDensity: 1,
      spinner: mockSpinner,
    });

    expect(result).toBeNull();
    expect(mockDb.delete).toHaveBeenCalledWith({
      profile: "variantProfileHash",
      source: "sourceHash",
    });
  });
});
