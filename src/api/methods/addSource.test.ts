import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import type { BaseSource } from "../BaseSource.js";
import { addSource } from "./addSource.js";

vi.mock("node:fs", () => ({
  default: {
    promises: {
      writeFile: vi.fn(),
    },
  },
}));

describe("Unit/api/utils/addSource", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSource = {
    type: "remote",
    options: {
      placeholder: "dominantColor",
      placeholderColor: undefined,
      processor: "mock-processor",
    },
    settings: {
      scopedStyleStrategy: "attribute",
    },
    data: {
      hash: "mock-hash",
    },
    dirs: {
      downloadDir: "mock-download-dir",
    },
    downloadPath: undefined,
    getBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-buffer")),
    db: {
      insert: vi.fn(),
    },
  } as unknown as BaseSource;

  // getMetadataFromBufferをモック
  vi.mock("../utils/getMetadataFromBuffer.js", () => ({
    getMetadataFromBuffer: vi.fn((args) =>
      args.useDominant
        ? { format: "png", width: 1024, height: 768, r: 0, g: 0, b: 0 }
        : { format: "png", width: 1024, height: 768 },
    ),
  }));

  test("get metadata from buffer", async () => {
    await addSource(mockSource);
    expect(mockSource.data.r).toBe(0);
  });

  test("set downloadPath for remote sources", async () => {
    await addSource(mockSource);
    expect(mockSource.downloadPath).toBe(
      path.join("mock-download-dir", "mock-hash.png"),
    );
  });

  test("insert data into db", async () => {
    await addSource(mockSource);
    expect(mockSource.db.insert).toHaveBeenCalledWith(mockSource.data);
  });

  test('placeholder is not "dominantColor"', async () => {
    const source = {
      ...mockSource,
      data: {
        hash: "mock-hash",
      },
      options: { ...mockSource.options, placeholder: "other" },
    } as unknown as BaseSource;
    await addSource(source);
    expect(source.data.r).toBeUndefined();
  });

  test("dominantColor is defined", async () => {
    const source = {
      ...mockSource,
      data: {
        hash: "mock-hash",
      },
      options: { ...mockSource.options, placeholderColor: "#fff" },
    } as unknown as BaseSource;
    await addSource(source);
    expect(source.data.r).toBeUndefined();
  });
});
