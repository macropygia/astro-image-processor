// @ts-nocheck
import {
  type Mock,
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { defaultGlobalClassNames } from "../const.js";
import { ArtDirectiveSource } from "./ArtDirectiveSource.js";
import type { ImageSourceArgs } from "./ImageSource.js";
import { PictureSource, type PictureSourceArgs } from "./PictureSource.js";
import { generateComponentHash } from "./methods/generateComponentHash.js";
import { parseCssObj } from "./utils/parseCssObj.js";

vi.mock("./BaseSource.js", () => {
  return {
    BaseSource: class {
      constructor(args: ImageSourceArgs) {
        this.options = args.options;
      }
      main() {}
    },
  };
});
vi.mock("./ArtDirectiveSource.js");

vi.mock("./methods/generateComponentHash.js");
vi.mock("./utils/parseCssObj.js");

describe("Unit/api/PictureSource", () => {
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
        formats: ["jpeg", "webp"],
        objectFit: "cover",
        layout: "constrained",
      },
      componentType: "picture",
    };
    (generateComponentHash as any).mockReturnValue("mockHash");
    (parseCssObj as any).mockReturnValue("parsed-css");
  }) as unknown as PictureSourceArgs;

  afterAll(() => {
    vi.clearAllMocks();
  });

  test("factory", async () => {
    const instance = await PictureSource.factory(args);

    expect(instance.componentType).toBe("picture");
    expect(instance.componentHash).toBe("mockHash");
    expect(generateComponentHash).toHaveBeenCalledWith(
      { componentType: "picture", ...args.options },
      args.ctx.settings.hasher,
    );
  });

  test("parseArtDirectives", async () => {
    const instance = await PictureSource.factory(args);
    instance.options = { tagName: "section" };

    const empty = await instance.parseArtDirectives();
    expect(empty).toBeUndefined();

    instance.options.artDirectives = [1, 2];
    (ArtDirectiveSource.factory as Mock).mockImplementation(
      async () => "directive",
    );
    await instance.parseArtDirectives();
    expect(instance.artDirectives).toEqual(["directive", "directive"]);
  });

  test("pictureClassList", async () => {
    const instance = await PictureSource.factory(args);
    instance.settings = {
      scopedStyleStrategy: "class",
      globalClassNames: defaultGlobalClassNames,
    };
    instance.options = { objectFit: "fill" };
    const classList = instance.pictureClassList;

    expect(classList).toEqual(["aip-elm-picture", "astro-aip-mockHash"]);
  });

  test("asBackground", async () => {
    const instance = await PictureSource.factory({
      ...args,
      asBackground: true,
    });
    instance.settings = {
      scopedStyleStrategy: "class",
      globalClassNames: defaultGlobalClassNames,
    };
    instance.options = { objectFit: "fill" };
    const classList = instance.pictureClassList;

    expect(instance.asBackground).toBe(true);
    expect(classList).toEqual([
      "aip-elm-picture",
      "astro-aip-mockHash",
      "aip-elm-as-background",
    ]);
  });

  test("pictureAttributes & sources", async () => {
    const instance = await PictureSource.factory(args);
    instance.variants = {
      avif: [
        {
          width: 800,
          height: 600,
          hash: "avifhash",
          format: "avif",
          ext: "avif",
          descriptor: "800w",
        },
      ],
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
      formats: ["avif", "webp"],
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

    const pictureAttributes = instance.pictureAttributes;
    expect(pictureAttributes).toEqual({
      "data-astro-aip-mockHash": true,
    });

    instance.artDirectives = [
      {
        sources: [
          {
            srcset: "mock-srcset-1-1",
            width: 800,
            height: 600,
            type: "image/avif",
            media: "(media1)",
          },
          {
            srcset: "mock-srcset-1-1",
            width: 800,
            height: 600,
            type: "image/avif",
            media: "(media2)",
          },
        ],
      },
      {
        sources: [
          {
            srcset: "mock-srcset-2-1",
            width: 800,
            height: 600,
            type: "image/webp",
            media: "(media1)",
          },
          {
            srcset: "mock-srcset-2-2",
            width: 800,
            height: 600,
            type: "image/webp",
            media: "(media2)",
          },
        ],
      },
    ];
    expect(instance.sources).toMatchObject([
      {
        height: 600,
        media: "(media1)",
        srcset: "mock-srcset-1-1",
        type: "image/avif",
        width: 800,
      },
      {
        height: 600,
        media: "(media2)",
        srcset: "mock-srcset-1-1",
        type: "image/avif",
        width: 800,
      },
      {
        height: 600,
        media: "(media1)",
        srcset: "mock-srcset-2-1",
        type: "image/webp",
        width: 800,
      },
      {
        height: 600,
        media: "(media2)",
        srcset: "mock-srcset-2-2",
        type: "image/webp",
        width: 800,
      },
      {
        height: 600,
        srcset: "avifhash.avif 800w",
        type: "image/avif",
        width: 800,
      },
    ]);
  });

  test("cssObj (dominantColor)", async () => {
    const instance = await PictureSource.factory(args);
    instance.options = {
      ...args.options,
    };
    instance.settings = {
      globalClassNames: defaultGlobalClassNames,
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

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-color", "rgb(0 255 0)"],
          ["object-fit", "cover"],
        ],
        "picture[scope]::after": [["background-color", "rgb(0 255 0)"]],
      },
    });
    instance.options.objectPosition = "60% 40%";
    instance.options.placeholderColor = "#fff";

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-color", "#fff"],
          ["object-fit", "cover"],
          ["object-position", "60% 40%"],
        ],
        "picture[scope]::after": [["background-color", "#fff"]],
      },
    });
  });

  test("cssObj (blurred)", async () => {
    const instance = await PictureSource.factory(args);
    instance.options = {
      ...args.options,
      placeholder: "blurred",
    };
    instance.settings = {
      globalClassNames: defaultGlobalClassNames,
    };
    instance.resolved = { width: 1024, height: 768 };

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-size", "cover"],
          ["background-position", "50% 50%"],
          ["background-image", "var(--aip-blurred-image)"],
          ["object-fit", "cover"],
        ],
        "picture[scope]": [["--aip-blurred-image", `url("undefined")`]],
        "picture[scope]::after": [
          ["background-image", "var(--aip-blurred-image)"],
          ["background-size", "cover"],
          ["background-position", "50% 50%"],
        ],
      },
    });

    instance.options.objectPosition = "60% 40%";

    expect(instance.cssObj).toEqual({
      selectors: {
        "img[scope]": [
          ["background-size", "cover"],
          ["background-position", "60% 40%"],
          ["background-image", "var(--aip-blurred-image)"],
          ["object-fit", "cover"],
          ["object-position", "60% 40%"],
        ],
        "picture[scope]": [["--aip-blurred-image", `url("undefined")`]],
        "picture[scope]::after": [
          ["background-image", "var(--aip-blurred-image)"],
          ["background-size", "cover"],
          ["background-position", "60% 40%"],
        ],
      },
    });
  });

  test("css", async () => {
    const instance = await PictureSource.factory(args);
    instance.options = { ...args.options };
    instance.settings = { scopedStyleStrategy: "attribute" };
    const directiveCssObj = {
      media: "(media)",
      selectors: { selector: [["prop", "value"]] },
    };
    instance.artDirectives = [
      {
        cssObj: directiveCssObj,
      },
    ];
    instance.resolved = { width: 1024, height: 768 };

    const css = instance.css;

    expect(css).toBe("parsed-css");
    expect(parseCssObj).toHaveBeenCalledWith({
      componentHash: "mockHash",
      scopedStyleStrategy: "attribute",
      styles: [instance.cssObj, directiveCssObj],
    });
  });

  test("links", async () => {
    const instance = await PictureSource.factory(args);

    const links1 = instance.links;
    expect(links1).toBeNull();

    instance.link = "link";
    const links2 = instance.links;
    expect(links2).toEqual(["link"]);

    instance.artDirectives = [
      {
        link: "links1",
      },
      {
        link: "links2",
      },
    ];
    const links3 = instance.links;
    expect(links3).toEqual(["link", "links1", "links2"]);
  });
});
