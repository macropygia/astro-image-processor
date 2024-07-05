// @ts-nocheck
import { beforeEach, describe, expect, test, vi } from "vitest";

import { defaultGlobalClassNames } from "../const.js";
import type {} from "../types.js";
import { ImageSource, type ImageSourceArgs } from "./ImageSource.js";
import { generateComponentHash } from "./methods/generateComponentHash.js";
import { parseCssObj } from "./utils/parseCssObj.js";

vi.mock("./BaseSource.js");
vi.mock("./methods/generateComponentHash.js");
vi.mock("./utils/parseCssObj.js");

describe("Unit/api/ImageSource", () => {
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
        format: "webp",
        objectFit: "cover",
        layout: "constrained",
      },
      componentType: "img",
    };
    (generateComponentHash as any).mockReturnValue("mockHash");
    (parseCssObj as any).mockReturnValue("parsed-css");
  }) as unknown as ImageSourceArgs;

  test("factory", async () => {
    const instance = await ImageSource.factory(args);

    expect(instance.componentType).toBe("img");
    expect(instance.componentHash).toBe("mockHash");
    expect(generateComponentHash).toHaveBeenCalledWith(
      { componentType: "img", ...args.options },
      args.ctx.settings.hasher,
    );
  });

  test("imageClassList", async () => {
    const instance = await ImageSource.factory(args);
    instance.settings = {
      scopedStyleStrategy: "class",
      globalClassNames: defaultGlobalClassNames,
    };
    instance.options = { objectFit: "fill" };

    expect(instance.imageClassList).toEqual([
      "aip-elm-img",
      "astro-aip-mockHash",
    ]);

    instance.asBackground = true;
    expect(instance.imageClassList).toEqual([
      "aip-elm-img",
      "astro-aip-mockHash",
      "aip-elm-as-background",
    ]);

    instance.asBackground = false;
    instance.options.layout = "constrained";

    expect(instance.imageClassList).toEqual([
      "aip-elm-img",
      "astro-aip-mockHash",
      "aip-layout-constrained",
    ]);
  });

  test("imageAttributes", async () => {
    const instance = await ImageSource.factory(args);
    instance.variants = {
      webp: [
        {
          width: 800,
          height: 600,
          hash: "webphash",
          format: "webp",
          ext: "webp",
          descriptor: "800w",
        },
      ],
    };
    instance.options = {
      format: "webp",
      placeholder: "blurred",
    };
    instance.resolved = {
      width: 800,
      height: 600,
      sizes: "(max-width: 800px) 100vw, 800px",
    };
    instance.settings = {
      scopedStyleStrategy: "attribute",
      globalClassNames: defaultGlobalClassNames,
    };
    instance.resolvePath = vi.fn((item) => `${item.hash}.${item.ext}`);
    instance.componentType = "picture";

    expect(instance.imageAttributes).toEqual({
      src: "webphash.webp",
      srcset: "webphash.webp 800w",
      width: 800,
      height: 600,
      onload:
        "parentElement.style.setProperty('--aip-placeholder-animation-state', 'running');",
      sizes: "(max-width: 800px) 100vw, 800px",
      "data-astro-aip-mockHash": true,
    });

    instance.settings.scopedStyleStrategy = "class";
    instance.componentType = "img";
    expect(instance.imageAttributes).toEqual({
      src: "webphash.webp",
      srcset: "webphash.webp 800w",
      width: 800,
      height: 600,
      sizes: "(max-width: 800px) 100vw, 800px",
    });
  });

  test("cssObj (dominantColor)", async () => {
    const instance = await ImageSource.factory(args);
    instance.componentType = "img";
    instance.settings = {
      globalClassNames: defaultGlobalClassNames,
    };
    instance.options = {
      ...args.options,
      enforceAspectRatio: true,
    };
    instance.data = {
      r: 0,
      g: 255,
      b: 0,
    };
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [["object-fit", "cover"]],
      },
    });

    instance.options.placeholder = "dominantColor";
    instance.options.objectPosition = "60% 40%";

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-color", "rgb(0 255 0)"],
          ["object-fit", "cover"],
          ["object-position", "60% 40%"],
        ],
      },
    });

    instance.options = {
      ...args.options,
      placeholder: "dominantColor",
      placeholderColor: "#fff",
      enforceAspectRatio: true,
      tagName: "section",
    };
    instance.asBackground = true;
    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-color", "#fff"],
          ["object-fit", "cover"],
        ],
        "section[scope]": [
          ["width", "1024px"],
          ["aspect-ratio", "1024 / 768"],
        ],
      },
    });
  });

  test("cssObj (blurred)", async () => {
    const instance = await ImageSource.factory(args);
    instance.settings = {
      globalClassNames: defaultGlobalClassNames,
    };
    instance.options = {
      ...args.options,
      placeholder: "blurred",
    };
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-size", "cover"],
          ["background-position", "50% 50%"],
          ["background-image", 'url("undefined")'],
          ["object-fit", "cover"],
        ],
      },
    });

    instance.options.objectPosition = "60% 40%";

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-size", "cover"],
          ["background-position", "60% 40%"],
          ["background-image", 'url("undefined")'],
          ["object-fit", "cover"],
          ["object-position", "60% 40%"],
        ],
      },
    });
  });

  test("css", async () => {
    const instance = await ImageSource.factory(args);
    instance.options = { ...args.options };
    instance.settings = { scopedStyleStrategy: "attribute" };
    instance.resolved = { width: 1024, height: 768 };
    const css = instance.css;

    expect(css).toBe("parsed-css");
    expect(parseCssObj).toHaveBeenCalledWith({
      componentHash: "mockHash",
      scopedStyleStrategy: "attribute",
      styles: [instance.cssObj],
    });
  });

  test("containerClassList", async () => {
    const instance = await ImageSource.factory(args);
    instance.options = { layout: "constrained" };
    instance.settings = { globalClassNames: defaultGlobalClassNames };

    instance.asBackground = false;
    const none = instance.containerClassList;
    expect(none).toEqual([]);

    instance.asBackground = true;
    const notAttr = instance.containerClassList;
    expect(notAttr).toEqual([
      "aip-elm-container",
      "astro-aip-mockHash",
      "aip-layout-constrained",
    ]);

    instance.settings.scopedStyleStrategy = "attribute";
    const attr = instance.containerClassList;
    expect(attr).toEqual(["aip-elm-container", "aip-layout-constrained"]);
  });

  test("containerAttributes", async () => {
    const instance = await ImageSource.factory(args);

    instance.asBackground = false;
    instance.settings = { scopedStyleStrategy: "class" };
    const none = instance.containerAttributes;
    expect(none).toEqual({});

    instance.asBackground = true;
    const notAttr = instance.containerAttributes;
    expect(notAttr).toEqual({});

    instance.settings.scopedStyleStrategy = "attribute";
    const attr = instance.containerAttributes;
    expect(attr).toEqual({
      "data-astro-aip-mockHash": true,
    });
  });
});
