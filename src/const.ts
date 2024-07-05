import os from "node:os";

import sharp from "sharp";

import { JsonFileDataAdapter } from "./extras/JsonFileDataAdapter.js";
import { cryptoHasher } from "./extras/cryptoHasher.js";
import type { ImgProcOptions, ImgProcOutputFormat } from "./types.js";

export const defaultGlobalClassNames = {
  element: {
    img: "aip-elm-img",
    picture: "aip-elm-picture",
    background: "aip-elm-background",
    container: "aip-elm-container",
    asBackground: "aip-elm-as-background",
  },
  layout: {
    constrained: "aip-layout-constrained",
    fixed: "api-layout-fixed",
    fullWidth: "aip-layout-fullWidth",
    fill: "aip-layout-fill",
  },
  cssVariables: {
    placeholderAnimationState: "--aip-placeholder-animation-state",
    blurredImage: "--aip-blurred-image",
  },
};

export const defaultOptions: Omit<ImgProcOptions, "scopedStyleStrategy"> = {
  imageCacheDirPattern: "[cacheDir]astro-image-processor/",
  downloadDirPattern: "[imageCacheDir]downloads/",
  imageAssetsDirPattern: "/[assetsDirName]/",
  imageOutDirPattern: "[outDir]",
  preserveDirectories: false,
  fileNamePattern: "[name]_[width]x[height]@[descriptor].[ext]?[hash8]",
  disableCopy: false,
  useSrcForHash: false,
  // scopedStyleStrategy: "attribute", // Inherit from Astro
  timeoutDuration: 1000 * 5,
  retentionPeriod: 1000 * 60 * 60 * 24 * 100,
  retentionCount: 10,
  hasher: cryptoHasher,
  globalClassNames: defaultGlobalClassNames,
  concurrency: Math.max(os.cpus().length, 1),
  dataAdapter: new JsonFileDataAdapter(),
  componentProps: {
    placeholder: "blurred",
    blurProcessor: sharp().resize(20).webp({ quality: 1 }),
    upscale: "never",
    layout: "constrained",
    // objectFit: "cover",
    // objectPosition: null,
    // backgroundSize: "cover",
    // backgroundPosition: "50% 50%",
    format: "webp",
    formats: ["avif", "webp"],
    tagName: "div",
    minAge: 1000 * 60 * 60 * 24,
  },
  formatOptions: {},
};

export const extByFormat: Record<ImgProcOutputFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  gif: "gif",
};

export const componentTypeToTag = {
  img: "<Image>",
  picture: "<Picture>",
  background: "<Backgorund>",
};

/**
 * Replicate `object-fit` by `background-size`
 * - `scale-down` is treated as `contain`
 */
export const replicateFitByBg: Record<
  "fill" | "contain" | "cover" | "none" | "scale-down",
  [string, string]
> = {
  fill: ["background-size", "100% 100%"],
  contain: ["background-size", "contain"],
  cover: ["background-size", "cover"],
  none: ["background-size", "auto"],
  "scale-down": ["background-size", "contain"],
};
