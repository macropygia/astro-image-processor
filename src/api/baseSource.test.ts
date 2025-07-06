import fs from "node:fs";

import sharp from "sharp";
import { type Mock, afterEach, describe, expect, test, vi } from "vitest";

import { mockContext } from "#mock/mock.js";
import type { ImgProcContext } from "../types.js";
import { BaseSource, type BaseSourceArgs } from "./BaseSource.js";
import { addSource } from "./methods/addSource.js";
import { generateBlurredImage } from "./methods/generateBlurredImage.js";
import { generateSourceHash } from "./methods/generateSourceHash.js";
import { renewSource } from "./methods/renewSource.js";
import { resolveElementDimensions } from "./methods/resolveElementDimensions.js";
import { resolveWidths } from "./methods/resolveWidths.js";
// import { resolveSizes } from './methods/resolveSizes.js';
// import { generateVariants } from './methods/generateVariants.js';
import { getBufferFromDataUrl } from "./utils/getBufferFromDataUrl.js";
import { getBufferFromRemoteUrl } from "./utils/getBufferFromRemoteUrl.js";
// import { normalizePath } from './utils/normalizePath.js';
import { getFilteredSharpOptions } from "./utils/getFilteredSharpOptions.js";

vi.mock("node:fs", () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    },
  },
}));
// vi.mock("node:path");
vi.mock("./methods/addSource.js");
vi.mock("./methods/generateBlurredImage.js");
vi.mock("./methods/generateSourceHash.js");
vi.mock("./methods/renewSource.js");
vi.mock("./methods/resolveElementDimensions.js");
vi.mock("./methods/resolveWidths.js");
vi.mock("./methods/resolveSizes.js");
vi.mock("./methods/generateVariants.js");
vi.mock("./utils/getBufferFromDataUrl.js");
vi.mock("./utils/getBufferFromRemoteUrl.js");
// vi.mock("./utils/normalizePath.js");
vi.mock("./utils/getFilteredSharpOptions.js");

describe("Unit/api/BaseSource", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    test("local file (root)", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg", width: 800, height: 600 },
      };
      // @ts-ignore
      const instance = new BaseSource(args);

      expect(instance.localSourcePath).toBe(
        `${mockContext.dirs.rootDir}path/to/image.jpg`,
      );
      expect(instance.type).toBe("local");
    });

    test("local file (assets)", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "background",
        options: {
          src: `/${mockContext.dirs.assetsDirName}/path/to/image.jpg`,
        },
      };
      // @ts-ignore
      const instance = new BaseSource(args);

      expect(instance.localSourcePath).toBe(
        `${mockContext.dirs.outDir}${mockContext.dirs.assetsDirName}/path/to/image.jpg`,
      );
      expect(instance.type).toBe("local");
    });

    test("local file (@fs)", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/@fs/path/to/image.jpg" },
      };
      // @ts-ignore
      const instance = new BaseSource(args);

      expect(instance.localSourcePath).toBe("/path/to/image.jpg");
      expect(instance.type).toBe("local");
    });

    test("remote file", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "http://example.com/image.jpg" },
      };
      // @ts-ignore
      const instance = new BaseSource(args);

      expect(instance.localSourcePath).toBe("http://example.com/image.jpg");
      expect(instance.type).toBe("remote");
    });

    test("data URL", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "data:image/png;base64,abc" },
      };
      // @ts-ignore
      const instance = new BaseSource(args);

      expect(instance.localSourcePath).toBe("data:image/png;base64,abc");
      expect(instance.type).toBe("data");
    });

    test("invalid src", () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "" },
      };
      // @ts-ignore
      expect(() => new BaseSource(args)).toThrow("Invalid src attribute");
    });
  });

  describe("main", () => {
    test("initialize with cache", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce({
        hash: "mockHash",
      });

      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);

      expect(generateSourceHash).toHaveBeenCalled();
      expect(renewSource).toHaveBeenCalled();
      expect(addSource).not.toHaveBeenCalled();
      expect(resolveWidths).toHaveBeenCalled();
      expect(resolveElementDimensions).toHaveBeenCalled();
      expect(instance instanceof BaseSource).toBeTruthy();
    });

    test("initialize with new file", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);

      expect(addSource).toHaveBeenCalled();
      expect(instance instanceof BaseSource).toBeTruthy();
    });

    test("generate blurred image", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg", placeholder: "blurred" },
      };
      await BaseSource.factory(args);

      expect(generateBlurredImage).toHaveBeenCalled();
    });
  });

  describe("getBuffer", () => {
    test("buffer for local file", async () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);
      const mockBuffer = Buffer.from("test");
      (fs.promises.readFile as Mock).mockReturnValue(mockBuffer);

      const buffer = await instance.getBuffer();
      expect(buffer).toBe(mockBuffer);

      const loadedBuffer = await instance.getBuffer();
      expect(loadedBuffer).toBe(mockBuffer);
    });

    test("buffer for remote file", async () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "http://example.com/image.jpg" },
      };
      const instance = await BaseSource.factory(args);
      const mockBuffer = Buffer.from("test");
      (getBufferFromRemoteUrl as Mock).mockResolvedValue({
        buffer: mockBuffer,
        expiresAt: Date.now() + 10000,
      });

      const buffer = await instance.getBuffer();
      expect(buffer).toBe(mockBuffer);

      // downloadPath exists but cache does not exist
      instance.downloadPath = "mockDownloadPath";
      instance.buffer = undefined;
      (fs.existsSync as Mock).mockReturnValue(false);
      (fs.promises.writeFile as Mock).mockResolvedValue(undefined);

      const buffer2 = await instance.getBuffer();
      expect(buffer2).toBe(mockBuffer);

      // downloadPath exists and cache found
      instance.buffer = undefined;
      (fs.existsSync as Mock).mockReturnValue(true);
      (fs.promises.readFile as Mock).mockResolvedValue(mockBuffer);

      const buffer3 = await instance.getBuffer();
      expect(buffer3.toString()).toBe("test");
    });

    test("buffer for data URL", async () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "data:image/png;base64,abc" },
      };
      const instance = await BaseSource.factory(args);
      const mockBuffer = Buffer.from("test");
      (getBufferFromDataUrl as Mock).mockReturnValue(mockBuffer);

      const buffer = await instance.getBuffer();
      expect(buffer).toBe(mockBuffer);
    });
  });

  describe("profile", () => {
    test("empty processor", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);

      expect(instance.profile).toBeUndefined();
      expect(getFilteredSharpOptions).not.toHaveBeenCalled();
    });

    test("profile defined", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: {
          src: "/path/to/image.jpg",
          processor: sharp(),
          profile: "profile",
        },
      };
      const instance = await BaseSource.factory(args);

      expect(instance.profile).toBe("profile");
      expect(getFilteredSharpOptions).not.toHaveBeenCalled();
    });

    test("single processor", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      (getFilteredSharpOptions as Mock).mockReturnValue("profile");
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: {
          src: "/path/to/image.jpg",
          processor: sharp(),
        },
      };
      const instance = await BaseSource.factory(args);

      expect(instance.profile).toBe("profile");
      expect(getFilteredSharpOptions).toHaveBeenCalledOnce();
    });

    test("multiple processor", async () => {
      (mockContext.db.fetch as Mock).mockResolvedValueOnce(null);
      (getFilteredSharpOptions as Mock).mockReturnValue("profile");
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: {
          src: "/path/to/image.jpg",
          processor: [sharp(), sharp(), sharp()],
        },
      };
      const instance = await BaseSource.factory(args);

      expect(instance.profile).toMatchObject(["profile", "profile", "profile"]);
      expect(getFilteredSharpOptions).toBeCalledTimes(3);
    });
  });

  describe("resolvePath", () => {
    test("default", async () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);

      const currentMode = import.meta.env.MODE;
      import.meta.env.MODE = "development";
      expect(
        // @ts-ignore
        instance.resolvePath({
          hash: "mockHash",
          width: 800,
          height: 600,
          format: "avif",
          ext: "avif",
          descriptor: "x1",
        }),
      ).toBe("/_image?href=%2F%40fscache%2FmockHash.avif");

      import.meta.env.MODE = "production";
      (fs.existsSync as Mock).mockReturnValue(false);
      expect(
        // @ts-ignore
        instance.resolvePath({
          hash: "mockHash",
          width: 800,
          height: 600,
          format: "avif",
          ext: "avif",
          descriptor: "x1",
        }),
      ).toBe("img/mockHash.avif");

      import.meta.env.MODE = "ssr";
      expect(
        // @ts-ignore
        instance.resolvePath({
          hash: "mockHash",
          width: 800,
          height: 600,
          format: "avif",
          ext: "avif",
          descriptor: "x1",
        }),
      ).toBe("__SSR_NOT_SUPPORTED__mockHash.avif__");

      import.meta.env.MODE = currentMode;
    });

    test("disableCopy", async () => {
      const args: BaseSourceArgs = {
        ctx: {
          ...mockContext,
          settings: {
            imageOutDirPattern: "https://exmaple.com/cdn/",
            disableCopy: true,
          },
        } as unknown as ImgProcContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg" },
      };
      const instance = await BaseSource.factory(args);

      import.meta.env.MODE = "production";
      expect(
        // @ts-ignore
        instance.resolvePath({
          hash: "mockHash",
          width: 800,
          height: 600,
          format: "avif",
          ext: "avif",
          descriptor: "x1",
        }),
      ).toBe("https://exmaple.com/cdn/mockHash.avif");
    });
  });

  describe("link", () => {
    test("default", async () => {
      const args: BaseSourceArgs = {
        ctx: mockContext,
        componentType: "img",
        options: { src: "/path/to/image.jpg", preload: "webp" },
      };
      const instance = await BaseSource.factory(args);
      instance.variants = {
        webp: [
          {
            hash: "mockHash",
            format: "webp",
            width: 1024,
            height: 768,
            ext: "webp",
            descriptor: "1x",
          },
        ],
      };
      instance.resolved.sizes = "mockSizes";

      expect(instance.link).toEqual({
        as: "image",
        imagesizes: "mockSizes",
        imagesrcset: "img/mockHash.webp 1x",
        rel: "preload",
        type: "image/webp",
      });

      instance.options.media = "mockMedia";
      expect(instance.link).toEqual({
        as: "image",
        imagesizes: "mockSizes",
        imagesrcset: "img/mockHash.webp 1x",
        media: "mockMedia",
        rel: "preload",
        type: "image/webp",
      });

      instance.options.crossOrigin = "anonymous";
      expect(instance.link).toEqual({
        as: "image",
        crossorigin: "anonymous",
        imagesizes: "mockSizes",
        imagesrcset: "img/mockHash.webp 1x",
        media: "mockMedia",
        rel: "preload",
        type: "image/webp",
      });
    });
  });

  test("null", async () => {
    const args: BaseSourceArgs = {
      ctx: mockContext,
      componentType: "img",
      options: { src: "/path/to/image.jpg" },
    };
    const instance = await BaseSource.factory(args);
    expect(instance.link).toBeNull();

    instance.options.preload = "webp";
    expect(instance.link).toBeNull();
  });
});
