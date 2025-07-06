import path from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { mockLogger } from "#mock/mock.js";
import type { BaseSource } from "../BaseSource.js";
import { renewSource } from "./renewSource.js";

describe("Unit/api/methods/renewSource", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSource = {
    db: {
      updateMetadata: vi.fn(),
      renew: vi.fn(),
    },
    dirs: {
      downloadDir: "mock-download-dir",
    },
    type: "remote",
    options: {
      src: "mockImage.jpg",
      placeholder: "dominantColor",
      placeholderColor: undefined,
      processor: "mock-processor",
    },
    data: {
      hash: "mock-hash",
      format: "png",
      r: undefined,
      expiresAt: Date.now() + 10000,
    },
    downloadPath: undefined,
    logger: mockLogger,
    getBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-buffer")),
  } as unknown as BaseSource;

  vi.mock("../utils/getMetadataFromBuffer.js", () => ({
    getMetadataFromBuffer: vi.fn().mockResolvedValue({
      format: "png",
      width: 1024,
      height: 768,
      r: 1,
      g: 2,
      b: 3,
    }),
  }));

  test("hash missing", async () => {
    const invalidSource = {
      ...mockSource,
      data: { hash: undefined },
    } as unknown as BaseSource;
    await expect(renewSource(invalidSource)).rejects.toThrowError(
      "Invalid data",
    );
  });

  test("format missing", async () => {
    const invalidSource = {
      ...mockSource,
      data: { format: undefined },
    } as unknown as BaseSource;
    await expect(renewSource(invalidSource)).rejects.toThrowError(
      "Invalid data",
    );
  });

  test("resolve downloadPath", async () => {
    const source = { ...mockSource } as unknown as BaseSource;
    await renewSource(source);
    expect(source.downloadPath).toBe(
      path.join("mock-download-dir", "mock-hash.png"),
    );
  });

  test("read sharp().stat().dominant", async () => {
    const source = { ...mockSource } as unknown as BaseSource;
    source.data.expiresAt = Date.now() - 10000;
    await renewSource(source);
    expect(source.data.r).toBe(1);
    expect(source.db.updateMetadata).toHaveBeenCalledWith(source.data); // TODO: check
  });

  test("placeholder is not placeholderColor", async () => {
    const source = {
      ...mockSource,
      options: { ...mockSource.options, placeholder: "blurred" },
      data: {
        hash: "mock-hash",
        format: "png",
        r: undefined,
        expiresAt: Date.now() + 10000,
      },
    } as unknown as BaseSource;
    await renewSource(source);
    expect(source.data.r).toBeUndefined();
    expect(source.getBuffer).not.toBeCalled();
  });

  test("dominantColor is defined by user", async () => {
    const source = {
      ...mockSource,
      options: {
        ...mockSource.options,
        placeholderColor: "mock-dominant-color",
      },
      data: {
        hash: "mock-hash",
        format: "png",
        r: undefined,
        expiresAt: Date.now() + 10000,
      },
    } as unknown as BaseSource;
    await renewSource(source);
    expect(source.data.r).toBeUndefined();
    expect(source.getBuffer).not.toBeCalled();
  });

  test("dominantColor already exists", async () => {
    const source = {
      ...mockSource,
      data: { ...mockSource.data, r: "mock-r", expiresAt: Date.now() + 10000 },
    } as unknown as BaseSource;
    await renewSource(source);
    expect(source.data.r).toBe("mock-r");
    expect(source.getBuffer).not.toBeCalled();
  });
});
