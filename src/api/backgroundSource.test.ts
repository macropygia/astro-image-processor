// @ts-nocheck
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import { mockVariants } from "#mock/mock.js";
import {
  BackgroundSource,
  type BackgroundSourceArgs,
} from "./BackgroundSource.js";
import type { ImageSourceArgs } from "./ImageSource.js";
import { generateComponentHash } from "./methods/generateComponentHash.js";
import { parseCssObj } from "./utils/parseCssObj.js";

vi.mock("./BaseSource.js", () => {
  return {
    BaseSource: class {
      constructor(args: ImageSourceArgs) {
        this.options = args.options;
      }
      main() {}
      resolvePath(item: any) {
        return `${item.hash}.${item.ext}`;
      }
    },
  };
});
vi.mock("./ArtDirectiveSource.js");
vi.mock("./methods/generateComponentHash.js");
vi.mock("./utils/parseCssObj.js");

describe("Unit/api/BackgroundSource", () => {
  let args: ImageSourceArgs;

  beforeEach(() => {
    args = {
      ctx: {
        settings: {
          hasher: vi.fn(),
          scopedStyleStrategy: "attribute",
        },
      },
      options: {
        src: "test.jpg",
        formats: ["avif", "webp"],
      },
      componentType: "background",
    };
    (generateComponentHash as any).mockReturnValue("mockHash");
    (parseCssObj as any).mockReturnValue("parsed-css");
  }) as unknown as BackgroundSourceArgs;

  afterAll(() => {
    vi.clearAllMocks();
  });

  test("factory", async () => {
    const instance = await BackgroundSource.factory(args);

    expect(instance.componentType).toBe("background");
    expect(instance.componentHash).toBe("mockHash");
    expect(generateComponentHash).toHaveBeenCalledWith(
      { componentType: "background", ...args.options },
      args.ctx.settings.hasher,
    );
  });

  test("cssObj", async () => {
    const instance = await BackgroundSource.factory(args);
    instance.options = {
      ...args.options,
      placeholder: null,
    };
    instance.data = {
      r: 0,
      g: 255,
      b: 0,
    };
    instance.resolved = { width: 1024, height: 768 };
    instance.variants = mockVariants;

    expect(instance.cssObj).toEqual({
      selectors: {
        "undefined[scope]": [
          ["background-image", `url("mockWebp2x.webp")`],
          [
            "background-image",
            `image-set(url("mockAvif2x.avif") 2x type("image/avif"),url("mockAvif1x.avif") 1x type("image/avif"),url("mockWebp2x.webp") 2x type("image/webp"),url("mockWebp1x.webp") 1x type("image/webp"))`,
          ],
        ],
      },
    });

    instance.options.layout = "fixed";
    instance.options.placeholder = "dominantColor";

    expect(instance.cssObj).toEqual({
      selectors: {
        "undefined[scope]": [
          ["background-color", "rgb(0 255 0)"],
          ["background-image", `url("mockWebp2x.webp")`],
          [
            "background-image",
            `image-set(url("mockAvif2x.avif") 2x type("image/avif"),url("mockAvif1x.avif") 1x type("image/avif"),url("mockWebp2x.webp") 2x type("image/webp"),url("mockWebp1x.webp") 1x type("image/webp"))`,
          ],
          ["width", "1024px"],
        ],
      },
    });

    instance.options.placeholder = "dominantColor";
    instance.options.placeholderColor = "#fff";
    instance.options.enforceAspectRatio = true;
    instance.options.objectFit = "cover";
    instance.options.backgroundSize = "cover";
    instance.options.backgroundPosition = "60% 40%";
    expect(instance.cssObj).toEqual({
      selectors: {
        "undefined[scope]": [
          ["background-color", "#fff"],
          ["background-image", `url("mockWebp2x.webp")`],
          [
            "background-image",
            `image-set(url("mockAvif2x.avif") 2x type("image/avif"),url("mockAvif1x.avif") 1x type("image/avif"),url("mockWebp2x.webp") 2x type("image/webp"),url("mockWebp1x.webp") 1x type("image/webp"))`,
          ],
          ["width", "1024px"],
          ["background-size", "cover"],
          ["background-position", "60% 40%"],
          ["aspect-ratio", "1024 / 768"],
        ],
      },
    });

    instance.options.placeholder = "blurred";

    expect(instance.cssObj).toEqual({
      selectors: {
        "undefined[scope]": [
          ["background-color", "#fff"],
          ["background-image", `url("mockWebp2x.webp")`],
          [
            "background-image",
            `image-set(url("mockAvif2x.avif") 2x type("image/avif"),url("mockAvif1x.avif") 1x type("image/avif"),url("mockWebp2x.webp") 2x type("image/webp"),url("mockWebp1x.webp") 1x type("image/webp"))`,
          ],
          ["width", "1024px"],
          ["background-size", "cover"],
          ["background-position", "60% 40%"],
          ["aspect-ratio", "1024 / 768"],
        ],
      },
    });
  });
});
