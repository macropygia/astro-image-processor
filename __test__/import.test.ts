import { describe, expect, test } from "vitest";

import {
  ArtDirectiveSource,
  BackgroundSource,
  BaseSource,
  ImageSource,
  PictureSource,
} from "../src/api/index.js";
// import { Picture } from "../src/components/index.js";
import {
  astroImageProcessor,
  defaultGlobalClassNames,
  defaultOptions,
} from "../src/index.js";

describe("Misc/import", () => {
  test("src/index.ts", () => {
    expect(astroImageProcessor).toBeDefined();
    expect(defaultGlobalClassNames).toBeDefined();
    expect(defaultOptions).toBeDefined();
  });

  test("src/api/index.ts", () => {
    expect(ArtDirectiveSource).toBeDefined();
    expect(BackgroundSource).toBeDefined();
    expect(BaseSource).toBeDefined();
    expect(ImageSource).toBeDefined();
    expect(PictureSource).toBeDefined();
  });

  // test("src/components/index.ts", () => {
  //   expect(Picture).toBeDefined();
  // });
});
