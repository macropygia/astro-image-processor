import sharp from "sharp";
import { afterAll, describe, expect, test, vi } from "vitest";

import { getMetadataFromBuffer } from "./getMetadataFromBuffer.js";

const mockSharpInstance = {
  metadata: vi.fn(() => ({
    format: "jpeg",
    width: 1024,
    height: 768,
  })),
  stats: vi.fn(() => ({
    dominant: {
      r: 1,
      g: 2,
      b: 3,
    },
  })),
  negate: vi.fn(() => true),
  toBuffer: vi.fn(),
};

vi.mock("sharp", () => ({
  __esModule: true,
  default: vi.fn(() => mockSharpInstance),
}));

vi.mock("./applyProcessors.js", () => ({
  __esModule: true,
  applyProcessors: vi.fn(() => ({
    stats: vi.fn(() => ({
      dominant: {
        r: 4,
        g: 5,
        b: 6,
      },
    })),
  })),
}));

const buffer = Buffer.from("test");

describe("Unit/api/utils/getMetadataFromBuffer", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  test("default", async () => {
    const metadata = await getMetadataFromBuffer({ buffer });

    expect(metadata).toMatchObject({
      format: "jpeg",
      width: 1024,
      height: 768,
    });
  });

  test("dominant", async () => {
    const metadata = await getMetadataFromBuffer({ buffer, useDominant: true });

    expect(metadata).toMatchObject({
      format: "jpeg",
      width: 1024,
      height: 768,
      r: 1,
      g: 2,
      b: 3,
    });
  });

  test("processor", async () => {
    const metadata = await getMetadataFromBuffer({
      buffer,
      useDominant: true,
      processor: sharp().negate(),
    });

    expect(metadata).toMatchObject({
      format: "jpeg",
      width: 1024,
      height: 768,
      r: 4,
      g: 5,
      b: 6,
    });
  });

  test("throw metadata()", async () => {
    // @ts-ignore
    mockSharpInstance.metadata.mockReturnValue({ format: "jpeg" });

    await expect(() => getMetadataFromBuffer({ buffer })).rejects.toThrowError(
      "Sharp could not retrieve metadata",
    );
  });

  test("throw stats()", async () => {
    mockSharpInstance.metadata.mockReturnValue({
      format: "jpeg",
      width: 1024,
      height: 768,
    });
    // @ts-ignore
    mockSharpInstance.stats.mockResolvedValue({ dominant: { r: 1 } });

    await expect(() =>
      getMetadataFromBuffer({ buffer, useDominant: true }),
    ).rejects.toThrowError("stats() failed");
  });
});
