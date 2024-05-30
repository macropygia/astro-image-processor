import type { Sharp } from "sharp";
import { describe, expect, test } from "vitest";

import { mockAstroConfig } from "@mock/mock.js";
import { deterministicHash } from "../../api/utils/deterministicHash.js";
import { getFilteredSharpOptions } from "../../api/utils/getFilteredSharpOptions.js";
import { defaultOptions } from "../../const.js";
import { xxHash3Hasher } from "../../extras/xxHash3Hasher.js";
import type { ImgProcFormatOptions } from "../../types.js";
import { resolveOptions } from "./resolveOptions";

describe("Unit/intergration/resolveOptions", () => {
  test("default", () => {
    const { componentProps, formatOptions, ...settings } = resolveOptions(
      undefined,
      mockAstroConfig,
    );

    const {
      componentProps: defaultComponentProps,
      formatOptions: defaultFormatOptions,
      ...defaultSettings
    } = defaultOptions;

    expect(
      deterministicHash(
        getFilteredSharpOptions(componentProps.blurProcessor),
        xxHash3Hasher,
      ),
    ).toBe(
      deterministicHash(
        getFilteredSharpOptions(defaultComponentProps.blurProcessor),
        xxHash3Hasher,
      ),
    );
    componentProps.blurProcessor = null as unknown as Sharp;
    defaultComponentProps.blurProcessor = null as unknown as Sharp;
    expect(componentProps).toMatchObject(defaultComponentProps);
    expect(formatOptions).toMatchObject({});
    expect(settings).toMatchObject(defaultSettings);
  });

  test("format options", () => {
    const mockFormatOptions: ImgProcFormatOptions = {
      jpeg: { quality: 90 },
      png: { quality: 90 },
      webp: { quality: 90 },
      avif: { quality: 90 },
    };

    const { formatOptions } = resolveOptions(
      {
        formatOptions: mockFormatOptions,
      },
      mockAstroConfig,
    );

    expect(formatOptions).toMatchObject(mockFormatOptions);
  });
});
