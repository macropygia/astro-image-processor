import { describe, expect, test } from "vitest";

import type { ImageSource } from "../ImageSource.js";
import { resolveSizes } from "./resolveSizes.js";

describe("Unit/api/utils/resolveSizes", () => {
  test.each([
    {
      source: {
        data: { width: 1000, height: 500 },
        options: { src: "src" },
        resolved: {
          widths: [500, 1000],
          densities: [1, 2],
          width: 1000,
        },
      },
      result: "(min-width: 1000px) 1000px, 100vw",
    },
    {
      source: {
        data: { width: 1000, height: 500 },
        options: { src: "src", sizes: "sizes" },
        resolved: {
          widths: [500, 1000],
          densities: [1, 2],
          width: 1000,
        },
      },
      result: "sizes",
    },
    {
      source: {
        data: { width: 1000, height: 500 },
        options: {
          src: "src",
          sizes: (resolvedWidths: number[], _resolvedDensities: number[]) =>
            resolvedWidths.join(),
        },
        resolved: {
          widths: [500, 1000],
          densities: [1, 2],
          width: 1000,
        },
      },
      result: "500,1000",
    },
  ])("default", (args) => {
    const result = resolveSizes(args.source as ImageSource);
    expect(result).toBe(args.result);
  });

  test.each([
    {
      data: { height: 500 },
      options: { src: "src" },
      resolved: {
        widths: [1000],
      },
    },
    {
      data: { width: 1000 },
      options: { src: "src" },
      resolved: {
        widths: [1000],
      },
    },
    {
      data: { width: 1000, height: 500 },
      options: { src: "src" },
      resolved: {},
    },
  ])("throw", (args) => {
    expect(() => resolveSizes(args as unknown as ImageSource)).toThrowError(
      args.resolved.widths
        ? "Invalid source demiensions or widths: src"
        : "Widths or densities unresolved: src",
    );
  });
});
