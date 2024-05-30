import { afterEach, describe, expect, test, vi } from "vitest";

import type { BaseSource } from "../BaseSource.js";
import { generateSourceHash } from "./generateSourceHash.js";

describe("Unit/api/methods/generateSourceHash", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSource = {
    type: "local",
    options: {
      src: "mock-src",
    },
    settings: {
      useSrcForHash: false,
      hasher: vi.fn(),
    },
    getBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-buffer")),
  } as unknown as BaseSource;

  test("hash from src (remote)", async () => {
    const remoteSource = {
      ...mockSource,
      type: "remote",
    } as unknown as BaseSource;
    const hasher = vi.fn().mockReturnValue("mock-hash");
    remoteSource.settings.hasher = hasher;

    const hash = await generateSourceHash(remoteSource);

    expect(hash).toBe("mock-hash");
    expect(hasher).toHaveBeenCalledWith("mock-src");
  });

  test("hash from src (local)", async () => {
    const localSource = {
      ...mockSource,
      settings: { ...mockSource.settings, useSrcForHash: true },
    } as unknown as BaseSource;
    const hasher = vi.fn().mockReturnValue("mock-hash");
    localSource.settings.hasher = hasher;

    const hash = await generateSourceHash(localSource);

    expect(hash).toBe("mock-hash");
    expect(hasher).toHaveBeenCalledWith("mock-src");
  });

  test("hash from buffer", async () => {
    const hasher = vi.fn().mockReturnValue("mock-hash");
    mockSource.settings.hasher = hasher;

    const hash = await generateSourceHash(mockSource);

    expect(hash).toBe("mock-hash");
    expect(hasher).toHaveBeenCalledWith(Buffer.from("mock-buffer"));
  });
});
