import { describe, expect, test } from "vitest";

import type { ImgProcCssObj } from "../../types.js";
import { parseCssObj } from "./parseCssObj.js";

const mockStyles: ImgProcCssObj[] = [
  {
    selectors: {
      "img[scope]": [["color", "red"]],
      "img[scope]::after": [["color", "blue"]],
    },
  },
  {
    media: "(max-width: 959px)",
    selectors: {
      "img[scope]": [["color", "green"]],
      "img[scope]::after": [["color", "yellow"]],
    },
  },
];

describe("Unit/api/utils/parseCss", () => {
  test("attribute", () => {
    const css = parseCssObj({
      componentHash: "mockhash",
      scopedStyleStrategy: "attribute",
      styles: mockStyles,
    });
    expect(css).toMatchInlineSnapshot(
      `"img[data-astro-aip-mockhash]{color:red}img[data-astro-aip-mockhash]::after{color:blue}@media(max-width: 959px){img[data-astro-aip-mockhash]{color:green}img[data-astro-aip-mockhash]::after{color:yellow}}"`,
    );
  });

  test("class", () => {
    const css = parseCssObj({
      componentHash: "mockhash",
      scopedStyleStrategy: "class",
      styles: mockStyles,
    });
    expect(css).toMatchInlineSnapshot(
      `"img.astro-aip-mockhash{color:red}img.astro-aip-mockhash::after{color:blue}@media(max-width: 959px){img.astro-aip-mockhash{color:green}img.astro-aip-mockhash::after{color:yellow}}"`,
    );
  });

  test("where", () => {
    const css = parseCssObj({
      componentHash: "mockhash",
      scopedStyleStrategy: "where",
      styles: mockStyles,
    });
    expect(css).toMatchInlineSnapshot(
      `"img:where(.astro-aip-mockhash){color:red}img:where(.astro-aip-mockhash)::after{color:blue}@media(max-width: 959px){img:where(.astro-aip-mockhash){color:green}img:where(.astro-aip-mockhash)::after{color:yellow}}"`,
    );
  });
});
