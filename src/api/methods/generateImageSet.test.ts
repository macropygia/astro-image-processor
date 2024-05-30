import { describe, expect, test } from "vitest";

import type { BaseSource } from "../BaseSource.js";
import { generateImageSet } from "./generateImageSet.js";

describe("Unit/api/methods/generateImageSet", () => {
  test("default", () => {
    const mockSource = {
      variants: {
        jpeg: [
          { descriptor: "1x", src: "image1.jpg" },
          { descriptor: "2x", src: "image2.jpg" },
        ],
        webp: [
          { descriptor: "1x", src: "image1.webp" },
          { descriptor: "2x", src: "image2.webp" },
        ],
      },
      options: {
        formats: ["jpeg", "webp"],
      },
      resolvePath: (item: any) => `/resolved/path/${item.src}`,
    } as unknown as BaseSource;

    const result = generateImageSet.call(mockSource);
    expect(result).toBe(
      'image-set(url("/resolved/path/image1.jpg") 1x type("image/jpeg"),url("/resolved/path/image2.jpg") 2x type("image/jpeg"),url("/resolved/path/image1.webp") 1x type("image/webp"),url("/resolved/path/image2.webp") 2x type("image/webp"))',
    );
  });

  test("throw (unresolved)", () => {
    const mockSource = {
      variants: null as any,
      options: {
        src: "mock.jpg",
        formats: ["jpeg"],
      },
      resolvePath: (item: any) => `/resolved/path/${item.src}`,
    } as unknown as BaseSource;

    expect(() => generateImageSet.call(mockSource)).toThrow(
      "Variants unresolved: mock.jpg",
    );
  });

  test("throw (invalid format)", () => {
    const mockSource = {
      variants: {
        jpeg: [{ descriptor: "1x", src: "image1.jpg" }],
      },
      options: {
        src: "mock.jpg",
        formats: ["jpeg", "webp"],
      },
      resolvePath: (item: any) => `/resolved/path/${item.src}`,
    } as unknown as BaseSource;

    expect(() => generateImageSet.call(mockSource)).toThrow(
      "Format mismatch: mock.jpg",
    );
  });
});
