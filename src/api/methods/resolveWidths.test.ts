import { describe, expect, test } from "vitest";

import type { ImageSource } from "../ImageSource.js";
import {
  convertDensitiesToWidths,
  filterWidths,
  resolveWidths,
} from "./resolveWidths.js";

describe("Unit/api/utils/resolveWidths", () => {
  test.each<{ upscale: "never" | "always" | "original"; [x: string]: any }>([
    {
      densities: [1, 2, 3],
      realWidth: 2500,
      upscale: "never",
      propWidth: 1000,
      result: {
        resolvedWidths: [1000, 2000],
        resolvedDensities: [1, 2],
      },
    },
    {
      densities: [1, 2, 3],
      realWidth: 2500,
      upscale: "always",
      propWidth: 1000,
      result: {
        resolvedWidths: [1000, 2000, 3000],
        resolvedDensities: [1, 2, 3],
      },
    },
    {
      densities: [1, 2, 3],
      realWidth: 2500,
      upscale: "original",
      propWidth: 1000,
      result: {
        resolvedWidths: [1000, 2000, 2500],
        resolvedDensities: [1, 2, 2.5],
      },
    },
    {
      densities: [1, 2, 3],
      realWidth: 3000,
      upscale: "never",
      result: {
        resolvedWidths: [1000, 2000, 3000],
        resolvedDensities: [1, 2, 3],
      },
    },
    {
      densities: [1, 2],
      realWidth: 1000,
      upscale: "never",
      result: {
        resolvedWidths: [500, 1000],
        resolvedDensities: [1, 2],
      },
    },
  ])("default", (args) => {
    const result = convertDensitiesToWidths(
      args.densities,
      args.realWidth,
      args.upscale,
      args.propWidth,
    );
    if (args.result) {
      expect(result).toMatchObject(args.result);
    }
  });

  test("throw", () => {
    expect(() =>
      convertDensitiesToWidths([1, 2, 3], 500, "never", 6000),
    ).toThrowError(
      "Nothing to output (minimum specified width is greater than real width)",
    );
  });
});

describe("Unit/api/utils/filterWidths", () => {
  test.each<{ upscale: "never" | "always" | "original"; [x: string]: any }>([
    {
      widths: [1000, 2000, 3000],
      realWidth: 2500,
      upscale: "never",
      result: [1000, 2000],
    },
    {
      widths: [1000, 2000, 3000],
      realWidth: 2500,
      upscale: "always",
      result: [1000, 2000, 3000],
    },
    {
      widths: [1000, 2000, 3000],
      realWidth: 2500,
      upscale: "original",
      result: [1000, 2000, 2500],
    },
  ])("default", (args) => {
    const result = filterWidths(args.widths, args.realWidth, args.upscale);
    if (args.result) {
      expect(result).toMatchObject(args.result);
    }
  });

  test("throw", () => {
    expect(() => filterWidths([1000, 2000], 500, "never")).toThrowError(
      "Nothing to output (minimum specified width is greater than real width)",
    );
  });
});

describe("Unit/api/utils/resolveWidths", () => {
  test.each([
    {
      source: {
        data: { width: 2000, height: 1000 },
        options: { width: 1000, height: 500 },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [1000],
          densities: [1],
        },
      },
    },
    {
      source: {
        data: { width: 2000, height: 1000 },
        options: { height: 500 },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [2000], // based on real width
          densities: [1],
        },
      },
    },
    {
      source: {
        data: { width: 2000, height: 1000 },
        options: { width: 1000 },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [1000],
          densities: [1],
        },
      },
    },
    {
      source: {
        options: { src: "src" },
        data: { width: 2000, height: 1000 },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [2000],
          densities: [1],
        },
      },
    },
    {
      source: {
        data: { width: 2000, height: 1000 },
        options: { width: 1000, height: 500, widths: [500, 1000, 1500, 2000] },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [500, 1000, 1500, 2000],
          densities: [0.5, 1, 1.5, 2],
        },
      },
    },
    {
      source: {
        data: { width: 2000, height: 1000 },
        options: { width: 1000, height: 500, densities: [0.5, 1, 2] },
        resolved: {},
      },
      result: {
        resolved: {
          widths: [500, 1000, 2000],
          densities: [0.5, 1, 2],
        },
      },
    },
  ])("default", (args) => {
    resolveWidths(args.source as unknown as ImageSource);
    expect(args.source).toMatchObject({ ...args.source, ...args.result });
  });

  test("throw", () => {
    expect(() =>
      resolveWidths({
        data: { width: 123 }, // height missing
        options: { src: "src" },
      } as ImageSource),
    ).toThrowError("Invalid source demiensions: src");

    expect(() =>
      resolveWidths({
        data: { height: 123 }, // width missing
        options: { src: "src" },
      } as ImageSource),
    ).toThrowError("Invalid source demiensions: src");

    expect(() =>
      resolveWidths({
        data: { width: 123, height: 123 },
        options: { src: "src", widths: [0], densities: [0] },
      } as ImageSource),
    ).toThrowError("Both widths and densities exist: src");
  });
});
