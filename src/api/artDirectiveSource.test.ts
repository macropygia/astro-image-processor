// @ts-nocheck
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { mockVariants } from "@mock/mock.js";
import type { ImgProcVariants } from "../types.js";
import {
  ArtDirectiveSource,
  type ArtDirectiveSourceArgs,
} from "./ArtDirectiveSource.js";

vi.mock("node:fs");
vi.mock("./BaseSource.js");
vi.mock("./methods/generateImageSet.js", () => ({
  generateImageSet: vi.fn(() => "image-set(mock-image-set)"),
}));

describe("Unit/api/ArtDirectiveSource", () => {
  let args: ArtDirectiveSourceArgs;

  beforeEach(() => {
    args = {
      componentHash: "testHash",
    } as unknown as ArtDirectiveSourceArgs;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("factory", async () => {
    const instance = await ArtDirectiveSource.factory(args);
    expect(instance).toBeInstanceOf(ArtDirectiveSource);
    expect(instance.componentHash).toBe(args.componentHash);
  });

  test("sources", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.options = {
      formats: ["jpeg"],
      media: "(min-width: 800px)",
    };
    instance.resolvePath = vi.fn((item) => `${item.hash}.${item.ext}`);
    instance.variants = {
      jpeg: [
        { descriptor: "1x", hash: "hash1", ext: "jpg" },
        { descriptor: "2x", hash: "hash2", ext: "jpg" },
      ],
    } as ImgProcVariants;
    instance.resolved = {
      width: 800,
      height: 600,
    };

    expect(instance.sources).toEqual([
      {
        srcset: "hash1.jpg 1x, hash2.jpg 2x",
        width: 800,
        height: 600,
        type: "image/jpeg",
        media: "(min-width: 800px)",
      },
    ]);

    instance.resolved.width = undefined;
    expect(() => instance.sources).toThrowError("Unresolved source");
  });

  test("cssObj/placeholder dominantColor", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.options = {
      placeholder: "dominantColor",
      media: "(min-width: 800px)",
      formats: ["avif", "webp"],
    };
    instance.data = {
      r: 255,
      g: 0,
      b: 0,
    };
    instance.variants = mockVariants;
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      media: "(min-width: 800px)",
      selectors: {
        "picture[scope]::after": [["background-color", "rgb(255 0 0)"]],
      },
    });

    instance.options.placeholderColor = "#fff";
    expect(instance.cssObj).toEqual({
      media: "(min-width: 800px)",
      selectors: {
        "picture[scope]::after": [["background-color", "#fff"]],
      },
    });

    instance.options.media = undefined;
    expect(() => instance.cssObj).toThrow("Media query does not exist");
  });

  test("cssObj/placeholder blurred", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.options = {
      placeholder: "blurred",
      media: "(min-width: 800px)",
      formats: ["avif", "webp"],
    };
    instance.blurredDataUrl = "data:image/jpeg;base64,...";
    instance.variants = mockVariants;
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      media: "(min-width: 800px)",
      selectors: {
        "picture[scope]::after": [
          ["background-size", "cover"],
          ["background-image", 'url("data:image/jpeg;base64,...")'],
          ["background-position", "50% 50%"],
        ],
      },
    });
  });

  test("cssObj/placeholder none", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.options = {
      placeholder: "none",
      media: "(min-width: 800px)",
      formats: ["avif", "webp"],
    };
    instance.variants = mockVariants;
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toBeUndefined();
  });

  test("cssObj/background", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.componentType = "background";
    instance.options = {
      placeholder: null,
      media: "(min-width: 800px)",
      formats: ["avif", "webp"],
      tagName: "div",
    };
    instance.variants = mockVariants;
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      media: "(min-width: 800px)",
      selectors: {
        "div[scope]": [
          ["background-image", `url("undefined")`],
          ["background-image", "image-set(mock-image-set)"],
        ],
      },
    });
  });

  test("backgroundCssObj", async () => {
    const instance = await ArtDirectiveSource.factory({});
    instance.componentType = "img";
    instance.options = {
      placeholder: "dominantColor",
      media: "(min-width: 800px)",
      formats: ["avif", "webp"],
      tagName: "div",
      enforceAspectRatio: true,
    };
    instance.variants = mockVariants;
    instance.resolved = {
      width: 1024,
      height: 768,
    };
    instance.data = {
      r: 1,
      g: 2,
      b: 3,
    };

    expect(instance.backgroundCssObj).toEqual({
      media: "(min-width: 800px)",
      selectors: {
        "div[scope]": [
          ["background-image", `url("undefined")`],
          ["background-image", "image-set(mock-image-set)"],
          ["background-color", "rgb(1 2 3)"],
          ["aspect-ratio", "1024 / 768"],
        ],
      },
    });

    instance.variants = [];
    expect(() => instance.backgroundCssObj).toThrowError("Format mismatch");

    instance.resolved.height = undefined;
    expect(() => instance.backgroundCssObj).toThrowError("Unresolved source");

    instance.resolved.height = 768;
    instance.resolved.width = undefined;
    expect(() => instance.backgroundCssObj).toThrowError("Unresolved source");

    instance.resolved.width = 1024;
    instance.variants = undefined;
    expect(() => instance.backgroundCssObj).toThrowError("Unresolved source");
  });
});
