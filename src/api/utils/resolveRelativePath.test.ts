import { describe, expect, test, vi } from "vitest";

import type { ImgProcContextDirectories } from "../../types.js";
import { resolveRelativePath } from "./resolveRelativePath.js";

const normalizePath = vi.fn((p: string) => p);

describe("Unit/api/utils/resolveRelativePath", () => {
  const dirs = {
    rootDir: "/project",
    srcDir: "/project/src",
  } as ImgProcContextDirectories;
  test.each([
    {
      src: "image.jpg",
      pathname: "some/path",
      expected: "/src/pages/some/path/image.jpg",
    },
    {
      src: "./image.jpg",
      pathname: "some/path",
      expected: "/src/pages/some/path/image.jpg",
    },
    {
      src: "../image.jpg",
      pathname: "some/path",
      expected: "/src/pages/some/image.jpg",
    },
  ])("default", ({ src, pathname, expected }) => {
    normalizePath.mockImplementation((p: string) => p);

    const result = resolveRelativePath({
      dirs,
      pathname,
      src,
    });
    expect(result).toBe(expected);
  });

  test.each([
    {
      src: "data:image/png;base64,abcd",
      expected: "data:image/png;base64,abcd",
    },
    {
      src: "http://example.com/image.jpg",
      expected: "http://example.com/image.jpg",
    },
    {
      src: "https://example.com/image.jpg",
      expected: "https://example.com/image.jpg",
    },
    { src: "/images/image.jpg", expected: "/images/image.jpg" },
    { src: "src/images/image.jpg", expected: "src/images/image.jpg" },
  ])("skip", ({ src, expected }) => {
    const result = resolveRelativePath({
      dirs,
      pathname: "some/path",
      src,
    });
    expect(result).toBe(expected);
  });
});
