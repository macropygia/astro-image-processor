import fs from "node:fs";
import path from "node:path";

import type { AstroIntegrationLogger } from "astro";
import { type Mock, describe, expect, test, vi } from "vitest";

import { mockContext } from "@mock/mock.js";
import { deleteOutdatedImages, pruneCache } from "./pruneCache.js";

vi.mock("node:fs", () => ({
  default: {
    promises: {
      readdir: vi.fn(),
      unlink: vi.fn(),
    },
  },
}));

const mockDb = mockContext.db;
const mockLogger = mockContext.logger as AstroIntegrationLogger;

describe("Unit/integration/utils/pruneCache", () => {
  test("default", async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(new Set(["hash3"]));
    (fs.promises.readdir as Mock).mockResolvedValue([
      { name: "hash1.avif", isFile: () => true, parentPath: "/path/to/" },
      { name: "dir", isFile: () => false, parentPath: "/path/to/" },
      { name: "hash3.webp", isFile: () => true, parentPath: "/path/to/" },
    ]);

    await pruneCache(mockContext);

    expect(fs.promises.readdir).toHaveBeenCalledWith("cache/", {
      withFileTypes: true,
    });
    expect(fs.promises.unlink).toHaveBeenCalledWith(
      path.join("/path/to/", "hash3.webp"),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Delete outdated cache: hash3.webp",
    );
    expect(mockDb.close).toHaveBeenCalled();
  });

  test("deleted", async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(
      new Set(["mock-hash3-hash"]),
    );
    await pruneCache(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith("1 files expired");
  });

  test("none", async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(null);
    await pruneCache(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith("No expired file found");
  });
});

describe("Unit/integration/utils/deleteOutdatedImages", () => {
  test("default", async () => {
    const parentPath = "/mock/dir";
    const hashes = new Set(["hash3"]);
    (fs.promises.readdir as Mock).mockResolvedValue([
      { name: "hash1.avif", isFile: () => true, parentPath },
      { name: "hash3.webp", isFile: () => true, parentPath },
      { name: "not_an_image.txt", isFile: () => true, parentPath },
    ]);

    await deleteOutdatedImages(parentPath, hashes, mockLogger);

    expect(fs.promises.readdir).toHaveBeenCalledWith(parentPath, {
      withFileTypes: true,
    });
    expect(fs.promises.unlink).toHaveBeenCalledWith(
      path.join(parentPath, "hash3.webp"),
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Delete outdated cache: hash3.webp",
    );
    expect(fs.promises.unlink).not.toHaveBeenCalledWith(
      path.join(parentPath, "not_an_image.txt"),
    );
  });
});
