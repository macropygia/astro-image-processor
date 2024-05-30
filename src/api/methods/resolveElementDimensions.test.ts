// @ts-nocheck
import { describe, expect, test } from "vitest";

import type { BaseSource } from "../BaseSource.js";
import { resolveElementDimensions } from "./resolveElementDimensions";

describe("Unit/api/utils/resolveElementDimensions", () => {
  const baseSource = {
    data: { width: 1024, height: 768 },
    options: {
      src: "/path/to/image.jpg",
      width: 1024,
      height: 768,
      format: "webp",
      formats: ["avif", "webp"],
    },
    variants: {
      webp: [
        {
          width: 1024,
        },
      ],
    },
    resolved: {},
    componentType: "img",
  } as unknown as BaseSource;

  test.each<{ source: BaseSource; result: any }>([
    {
      source: {
        ...baseSource,
      } as unknown as BaseSource,
      result: {
        width: 1024,
        height: 768,
      },
    },
    {
      source: {
        ...baseSource,
        options: {
          src: "/path/to/image.jpg",
          width: 512,
          format: "webp",
          formats: ["avif", "webp"],
        },
        variants: {
          webp: [
            {
              width: 768,
              height: 768,
            },
          ],
        },
      } as unknown as BaseSource,
      result: {
        width: 512,
        height: 512,
      },
    },
    {
      source: {
        ...baseSource,
        options: {
          src: "/path/to/image.jpg",
          height: 500,
          format: "webp",
          formats: ["avif", "webp"],
        },
        variants: {
          webp: [
            {
              width: 500,
              height: 1000,
            },
          ],
        },
        componentType: "picture",
      } as unknown as BaseSource,
      result: {
        width: 250,
        height: 500,
      },
    },
    {
      source: {
        ...baseSource,
        options: {
          src: "/path/to/image.jpg",
          format: "webp",
          formats: ["avif", "webp"],
        },
        variants: {
          webp: [
            {
              width: 500,
              height: 400,
            },
          ],
        },
        componentType: "picture",
      } as unknown as BaseSource,
      result: {
        width: 500,
        height: 400,
      },
    },
  ])("default", ({ source, result }) => {
    resolveElementDimensions(source);
    expect(source.resolved).toMatchObject(result);
  });

  test("throw", () => {
    expect(() =>
      resolveElementDimensions({ options: { src: "/path/to/image.jpg" } }),
    ).toThrowError("Variants unresolved: /path/to/image.jpg");

    expect(() =>
      resolveElementDimensions({
        variants: true,
        options: { src: "/path/to/image.jpg" },
        data: {},
      }),
    ).toThrowError("Invalid source demiensions: /path/to/image.jpg");

    expect(() =>
      resolveElementDimensions({
        variants: true,
        options: { src: "/path/to/image.jpg" },
        data: {
          width: 1024,
        },
      }),
    ).toThrowError("Invalid source demiensions: /path/to/image.jpg");
  });
});
