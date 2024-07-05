import type { AstroIntegrationLogger } from "astro";
import type { HTMLAttributes, HTMLTag } from "astro/types";
import type {
  AvifOptions,
  GifOptions,
  JpegOptions,
  PngOptions,
  Sharp,
  WebpOptions,
} from "sharp";
import type sharp from "sharp";
import type { ConfigEnv, ResolvedConfig, Rollup, ViteDevServer } from "vite";

import type { ArtDirectiveSourceArgs } from "./api/ArtDirectiveSource.js";
import type { BackgroundSourceArgs } from "./api/BackgroundSource.js";
import type { BaseSourceArgs } from "./api/BaseSource.js";
import type { ImageSourceArgs } from "./api/ImageSource.js";
import type { PictureSourceArgs } from "./api/PictureSource.js";
import type { defaultGlobalClassNames } from "./const.js";

// ===============================
// Configuration
// ===============================

/**
 * Image Processor User Options
 */
export interface ImgProcUserOptions extends Partial<ImgProcSettings> {
  /**
   * Default component properties (user settings)
   */
  componentProps?: Partial<
    Pick<
      ImgProcProcessorOptions,
      | "placeholder"
      | "placeholderColor"
      | "blurProcessor"
      | "upscale"
      | "layout"
      | "objectFit"
      | "objectPosition"
      | "enforceAspectRatio"
      | "backgroundSize"
      | "backgroundPosition"
      | "preload"
      | "format"
      | "formats"
      | "tagName"
      | "crossOrigin"
      | "minAge"
      | "maxAge"
    >
  >;
  /**
   * Default format options (user settings)
   */
  formatOptions?: ImgProcFormatOptions;
}

/**
 * Image Processor Options
 * - For configuration
 */
export interface ImgProcOptions extends ImgProcSettings {
  /**
   * Default component properties
   */
  componentProps: Omit<ImgProcProcessorOptions, "formatOptions">;
  /**
   * Default format options
   */
  formatOptions: ImgProcFormatOptions;
}

/**
 * General Settings
 * - For configuration
 */
export interface ImgProcSettings {
  /**
   * Image cache directory (pattern)
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[cacheDir]`: Replace with `cacheDir` in Astro.
   * @default `[cacheDir]astro-image-processor/`
   */
  imageCacheDirPattern: string;
  /**
   * Directory for downloading remote files (pattern)
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[cacheDir]`: Replace with `cacheDir` in Astro.
   *   - `[imageCacheDir]`: Replace with `imageCacheDir` in this intergration.
   * @default `[imageCacheDir]downloads/`
   */
  downloadDirPattern: string;
  /**
   * Image assets directory (pattern)
   * - Support the following placeholders:
   *   - `[assetsDirName]`: Replaced with `_astro` by default Astro settings
   * - Images placed in `/_astro/[hash].[ext]` by default.
   * @default `/[assetsDirName]/`
   */
  imageAssetsDirPattern: string;
  /**
   * Image output directory (pattern)
   * - Support the following placeholders:
   *   - `[root]`: Replace with `root` in Astro.
   *   - `[outDir]`: Replace with `outDir` in Astro.
   * - If `disableCopy` is `true`, use this value as path prefix. (Placeholder is disabled)
   *   - e.g. Set this value to `https://cdn.example.com/assets/` to generate src/srcset like `src="https://cdn.example.com/assets/[hash].webp"`, and `rsync --update --delete` to synchronize `imageCacheDir` to CDN.
   * @default `[outDir]`
   */
  imageOutDirPattern: string;
  /**
   * Preserve directory structure for image files
   * - Place images by root relative paths with `srcDir` as the document root
   * - Image filenames are resolved according to `fileNamePattern`
   * - e.g.
   *   - Place the source file in `/src/assets/images/foo/bar.png` and set the `src` property in the component to the same value
   *   - Image output to `/dist/assets/images/foo/[resolved fileNamePattern]`
   *   - The `src` and `srcset` of the `<img>` element etc. will contain `/assets/images/foo/[resolved fileNamePattern]`
   * @default false
   * @experimental
   */
  preserveDirectories: boolean;
  /**
   * File name pattern when preserve directory structure option is enabled
   * - Uses if `preserveDirectories` is true
   * - Support the following placeholders:
   *   - `[name]`: Original file name (without extension)
   *   - `[hash]`: File hash (full)
   *   - `[hash8]`: File hash (first 8 characters)
   *   - `[width]`: Resolved width
   *   - `[height]`: Resolved height
   *   - `[descriptor]`: `1x` `2x` `1000w` `2000w`
   *   - `[ext]`: Extension (without period)
   * - The file name must include all of `[name]`, `[width]`, `[height]`, and `[descriptor]`, or include `[hash8]` or `[hash]`
   *   - If this condition is not met, different images may be given the same name
   * - Cache buster can be specified using the hash and query parameter
   * @default `[name]_[width]x[height]@[descriptor].[ext]?[hash8]`
   * @experimental
   */
  fileNamePattern: string;
  /**
   * Disable copying from the cache to the output directory
   * - Refer to the description of `imageOutDirPattern`
   * @default false
   */
  disableCopy: boolean;
  /**
   * Use the string from the component's `src` property to generate a hash for identifying local image files
   * - Fast since it doesn't require reading the image file during hash generation
   *   - However, duplicate files cannot be detected
   * - Note that files will be recognized as different if the file name or directory changes
   * @default false
   */
  useSrcForHash: boolean;
  /**
   * Specify the strategy used for scoping styles
   * @see [Astro Docs scopedStyleStrategy](https://docs.astro.build/en/reference/configuration-reference/#scopedstylestrategy)
   * @default Inherit Astro settings
   */
  scopedStyleStrategy: "where" | "class" | "attribute";
  /**
   * Class names used in global CSS
   * - If change this, need to create and place the corresponding global CSS
   * @default Configured for `<GlobalStyles>` component
   */
  globalClassNames: typeof defaultGlobalClassNames;
  /**
   * Concurrency
   * @default Math.max(os.cpus().length, 1)
   */
  concurrency: number;
  /**
   * Download timeout duration (milliseconds)
   * - Timeout duration for downloading remote files
   * @default: 5000 (5 seconds)
   */
  timeoutDuration: number;
  /**
   * Cache retention period (ms)
   * - If not used within the set period, the cache will be subject to deletion
   * - If set to `null`, disables cache deletion by this policy
   * - If both period and count are enabled, they are processed under `AND` conditions
   * @default 8640000 (100 days)
   */
  retentionPeriod: number | null;
  /**
   * Cache retention count
   * - Delete the cache if not used consecutively in the last `n` builds.
   * - If set to `null`, disables cache deletion by this policy.
   * - If both period and count are enabled, they are processed under `AND` conditions.
   * @default 10
   */
  retentionCount: number | null;
  /**
   * Hash generator for buffer and string
   * - Recommended to use `astro-image-processor/extras/xxHash3Hasher` with [xxhash-addon](https://www.npmjs.com/package/xxhash-addon).
   * - **If the hasher (or more specifically, the hash algorithm) is changed, caches and database must be cleared.**
   *   - Changing the hasher will rename the image files.
   * @default "astro-image-processor/extras/cryptoHasher"
   */
  hasher: ImgProcHasher;
  /**
   * Data adapter for cache database
   * @default "astro-image-processor/extras/JsonFileDataAdapter"
   */
  dataAdapter: ImgProcDataAdapter;
}

/**
 * Default format options
 * - For configuration
 */
export interface ImgProcFormatOptions {
  /** @see sharp documantation */
  jpeg?: JpegOptions | undefined;
  /** @see sharp documantation */
  png?: PngOptions | undefined;
  /** @see sharp documantation */
  webp?: WebpOptions | undefined;
  /** @see sharp documantation */
  avif?: AvifOptions | undefined;
  /** @see sharp documantation */
  gif?: GifOptions | undefined;
}

/**
 * Input format
 */
export type ImgProcInputFormat = keyof sharp.FormatEnum;

/**
 * Output format
 */
export type ImgProcOutputFormat = keyof ImgProcFormatOptions;

// ===============================
// Component
// ===============================

/**
 * Component options
 * - Part of props
 */
export interface ImgProcProcessorOptions {
  /**
   * Source
   * - Local path, remote URL or data URL
   */
  src?: string;
  /**
   * @see [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/alt)
   */
  alt?: string;
  /**
   * Image width
   * - If `densities` option is used, this value is used as the value of `1x`.
   * - If not set and `densities` option is used, the source image is used as the maximum density.
   */
  width?: number | `${number}`;
  /**
   * Image height
   */
  height?: number | `${number}`;
  /**
   * `x` descriptors to be used in `srcset`
   * - Convert to `0.5x` `2x`
   * @example [0.5, 1, 2, 3]
   */
  densities?: number[];
  /**
   * `w` descriptors to be used in `srcset`
   * - Convert to `1000w` `2000w`
   * @example [1000, 1500, 2000]
   */
  widths?: number[];
  /**
   * @see [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/sizes)
   * @default  `(min-width: ${widths.at(-1)}px) ${widths.at(-1)}px, 100vw`
   */
  sizes?:
    | string
    | ((resolvedWidths: number[], resolvedDensities: number[]) => string);
  /**
   * @see [MDN Reference](https://developer.mozilla.org/docs/Web/HTML/Element/source#media)
   */
  media?: string;
  /**
   * Container element tagName
   * @default "div"
   */
  tagName: HTMLTag;
  /**
   * Placeholder
   * - `dominantColor` : Use `sharp().stats().dominant` or the value of `dominantColor` option
   *   - Use for `background-color` in BackgroundImage component.
   * - `blurred` : Use blurred image generated by `blurProcessor`
   *   - Unavailable for BackgroundImage component.
   * - `null` : Disable placeholder
   * @default "blurred"
   */
  placeholder: "dominantColor" | "blurred" | null;
  /**
   * Background color
   * - If set, use for placeholder instead of dominant color.
   * - Only works with `placeholder` option is `dominantColor`.
   * - Written to the CSS directly.
   * - Can also use `var(--foo)`.
   * @see [MDN Reference: color](https://developer.mozilla.org/docs/Web/CSS/color_value)
   */
  placeholderColor?: string;
  /**
   * Sharp instance to generate blurred images
   * - Note that blurred images are written to the inline CSS (and cache database) as Base64.
   * - Must include output option. ( `.webp()` `.avif()` etc.)
   * @defult `sharp().resize(20).webp({ quality: 1 })`
   */
  blurProcessor: Sharp;
  /**
   * How to handle the value of widths/densities that are larger than the image.
   * - `always`: Upscale the image to address all values.
   * - `never`: Ignore values larger than the original image size.
   *   - If image real width is `2500`, width prop is `1000` and densities prop is `[1, 2, 3]`, densities set to `[1, 2]`.
   * - `original`: Add the original image size as the largest value.
   *   - If image real width is `2500`, width prop is `1000` and densities prop is `[1, 2, 3]`, densities set to `[1, 2, 2.5]`.
   * @default "never"
   */
  upscale: "never" | "always" | "original";
  /**
   * Specify the horizontal layout of the image
   * - `constrained`: Set CSS as `width: 100%; max-width: ${resolvedWidth};`
   * - `fixed`: Set CSS as `width: ${resolvedWidth};`
   * - `fullWidth`: Set CSS as `width: 100%;`
   * - In the `<Image>` and `<Picture>` components, set to the `<img>` element.
   * - If component has container element, set to the container element.
   *     - If set to `constrained` or `fixed`, inherit CSS property `width` from the `<img>` element as scoped style.
   * @see [layout (Gatsby Image plugin)](https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-plugin-image/#layout)
   * @default "constrained"
   */
  layout?: "constrained" | "fixed" | "fullWidth" | null;
  /**
   * Set CSS property `object-fit` to the `<img>` element
   * - Requires `<GlobalStyles>` component
   * @see [MDN Reference: object-fit](https://developer.mozilla.org/docs/Web/CSS/object-fit)
   * @default "cover"
   */
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down" | null;
  /**
   * Set CSS property `object-position` to the `<img>` element
   * - If `placeholder` is `blurred`, the value uses for `background-position` property for blurred image.
   *     - By default, `50% 50%` is used.
   * @see [MDN Reference: object-position](https://developer.mozilla.org/docs/Web/CSS/object-position)
   * @default "50% 50%"
   */
  objectPosition?: string | null;
  /**
   * Set CSS property `aspect-ratio` to the container element based on `width` and `height`
   * - Only for `<Background>` component and background mode.
   * - If `width` and/or `height` are not set as properties, the values resolved within the component are used.
   * @see [MDN Reference: aspect-ratio](https://developer.mozilla.org/docs/Web/CSS/aspect-ratio)
   */
  enforceAspectRatio?: boolean;
  /**
   * Enforce background mode
   * - Only for `<Image>` and `<Picture>` components.
   * @default false
   */
  asBackground?: boolean;
  /**
   * Set CSS property `background-size` to the container element
   * - Only for `<Background>` component.
   * @see [MDN Reference: background-size](https://developer.mozilla.org/docs/Web/CSS/background-size)
   * @default "cover"
   */
  backgroundSize?: "cover" | "contain" | string | null;
  /**
   * Set CSS property `background-position` to the container element
   * - Only for `<Background>` component.
   * @see [MDN Reference: background-position](https://developer.mozilla.org/docs/Web/CSS/background-position)
   * @default "50% 50%"
   */
  backgroundPosition?: string | null;
  /**
   * Output `<link rel="preload" ... >`
   * - Only one format can be selected.
   */
  preload?: ImgProcOutputFormat;
  /**
   * Sharp instance to process the image
   * - Do not use [output options](https://sharp.pixelplumbing.com/api-output) except the options about Exif/ICC Profile/Metadata.
   * @example sharp().grayscale().blur()
   * @see [sharp documentation](https://sharp.pixelplumbing.com/)
   */
  processor?: Sharp | Sharp[];
  /**
   * Identifier of image processing profile for caching
   * - **Not necessary for usual.**
   * - If not set, hash of `sharp().options` will be used to identify the processing profile.
   * - If set, this value is used instead of the hash. This is faster than calculating the hash each time.
   */
  profile?: string;
  /**
   * Output format
   * @default "webp"
   */
  format: ImgProcOutputFormat;
  /**
   * Output formats
   * - Last element is used as fallbak format.
   * @default ["avif", "webp"]
   */
  formats: [ImgProcOutputFormat, ...ImgProcOutputFormat[]];
  /**
   * Format options
   * - `jpeg` `png` `avif` `webp` and `gif` are allowed.
   * @see [sharp document](https://sharp.pixelplumbing.com/api-output)
   */
  formatOptions: ImgProcFormatOptions;
  /**
   * Array of art directive objects
   */
  artDirectives?: ImgProcArtDirectiveSourceProps[];
  /**
   * Attributes for `<picture>` element
   */
  pictureAttributes?: HTMLAttributes<"picture">;
  /**
   * Attributes for container element
   */
  containerAttributes?:
    | HTMLAttributes<"div">
    | HTMLAttributes<"a">
    | Record<string, unknown>;
  /**
   * Minimum value of cache expiration period for remote files (milliseconds)
   * - Overrides HTTP header specification.
   * @default 1000 * 60 * 60 * 24 (1day)
   */
  minAge?: number;
  /**
   * Maximum value of cache expiration period for remote files (milliseconds)
   * - Overrides HTTP header specification.
   */
  maxAge?: number;
  /**
   * Cross origin for preload
   */
  crossOrigin?: "anonymous" | "use-credentials" | "" | undefined | null;
}

/**
 * Part of component props
 */
export type ImgProcWidthsInProps =
  | {
      widths?: number[];
      densities?: never;
    }
  | {
      widths?: never;
      densities?: number[];
    };

/**
 * Image component props
 */
export type ImgProcImageComponentProps = Omit<HTMLAttributes<"img">, "sizes"> &
  Partial<ImgProcProcessorOptions> & {
    src: string;
    alt: string;
    media?: never;
    formats?: never;
    artDirectives?: never;
    pictureAttributes?: never;
    backgroundSize?: never;
    backgroundPosition?: never;
  } & ImgProcWidthsInProps;

/**
 * Picture component props
 */
export type ImgProcPictureComponentProps = Omit<
  HTMLAttributes<"img">,
  "sizes"
> &
  Partial<ImgProcProcessorOptions> & {
    src: string;
    alt: string;
    media?: never;
    format?: never;
    backgroundSize?: never;
    backgroundPosition?: never;
  } & ImgProcWidthsInProps;

/**
 * Background component props
 */
export type ImgProcBackgroundComponentProps =
  Partial<ImgProcProcessorOptions> & {
    src: string;
    alt?: never;
    media?: never;
    widths?: never; // NOTE: https://drafts.csswg.org/css-images-4/#image-set-notation
    sizes?: never;
    placeholder?: "dominantColor" | null;
    blurProcessor?: never;
    objectFit?: never;
    objectPosition?: never;
    format?: never;
    pictureAttributes?: never;
    containerAttributes?: never;
    asBackground?: never;
  } & ImgProcWidthsInProps & {
      // Inherit from img element
      crossorigin?: "" | "anonymous" | "use-credentials" | null | undefined;
    } & Record<string, unknown>; // Accept all props

/**
 * Art directive props
 */
export type ImgProcArtDirectiveSourceProps =
  Partial<ImgProcProcessorOptions> & {
    src: string;
    alt?: never;
    media: string;
    layout?: never;
    tagName?: never;
    format?: never;
    pictureAttributes?: never;
    asBackground?: never;
    backgroundSize?: never;
    backgroundPosition?: never;
  } & ImgProcWidthsInProps;

// ===============================
// API
// ===============================

/**
 * Image variant item
 */
export interface ImgProcVariant {
  hash: string;
  width: number;
  height: number;
  format: ImgProcOutputFormat;
  ext: string;
  descriptor: string;
}

/**
 * Image variant groups
 */
export type ImgProcVariants = {
  [Key in ImgProcOutputFormat]?: ImgProcVariant[];
};

export type {
  ImageSourceArgs,
  PictureSourceArgs,
  BackgroundSourceArgs,
  ArtDirectiveSourceArgs,
  BaseSourceArgs,
};

// ===============================
// Data Adapter
// ===============================

/**
 * File category in cache
 */
export type ImgProcFileCategory = "source" | "variant" | "placeholder";

/**
 * Data entry in the cache database
 */
export interface ImgProcFile {
  /**
   * Hash
   * - Indexed
   * - Placeholder: `hasher(base64)`
   * - Remote file: `hasher(src)`
   * - Local file: `hasher(buffer)` or `hasher(src)`
   * - Data URL: `hasher(base64)`
   */
  hash: string;
  /** File category */
  category: ImgProcFileCategory;
  /** Base64 for placeholder */
  base64?: string;
  /** Real width */
  width: number;
  /** Real height */
  height: number;
  /**
   * Dominant color based on `sharp().stats()`
   * - Updatable
   */
  r?: number;
  /**
   * Dominant color based on `sharp().stats()`
   * - Updatable
   */
  g?: number;
  /**
   * Dominant color based on `sharp().stats()`
   * - Updatable
   */
  b?: number;
  /**
   * Source hash
   * - Indexed
   * - Variant/Placeholder: Source hash
   * - Source/Local file: Last used `src` attribute
   * - Source/Remote file: Last used downloaded URL
   * - Source/Data URL: Fixed string "data"
   */
  source: string;
  /**
   * Only for variant and placeholder
   */
  profile?: string;
  /**
   * Based on `sharp().metadata()`
   */
  format: string;
  /**
   * Remote image expiration date (unixtime, milliseconds)
   * - Updatable
   * - Based on `Cache-Control` or `Expires` header.
   * - Equivalent to browser cache.
   */
  expiresAt?: number | undefined;
}

/**
 * Data entry with metadata in the cache database
 */
export interface ImgProcFileRecord extends ImgProcFile {
  /** Unixtime of the last used build (ms) */
  lastUsedAt: number;
  /** Count to expiration */
  countdown: number;
}

/**
 * Options for data adapter initialize method
 */
export interface ImgProcDataAdapterInitOptions {
  rootDir: string;
  cacheDir: string;
  imageCacheDir: string;
  retentionPeriod: number | null;
  retentionCount: number | null;
}

export type ImgProcDataAdapterCriteria =
  | { hash: string; source?: never; profile?: never } // for `source`
  | { hash?: never; source: string; profile: string }; // for `variant` and `placeholder`

/**
 * Data adapter
 */
export interface ImgProcDataAdapter {
  /**
   * Initialize database
   */
  initialize: (options: ImgProcDataAdapterInitOptions) => void | Promise<void>;
  /**
   * Fetch single record
   * - To fetch a record with category `source`, specify `hash`.
   * - To fetch a record with category `variant` or `placeholder`, specify `source` and `profile`.
   */
  fetch: (
    criteria: ImgProcDataAdapterCriteria,
  ) => ImgProcFileRecord | Promise<ImgProcFileRecord> | null | Promise<null>;
  /** List all hashes */
  list: () => Set<string> | Promise<Set<string>>;
  /** Insert the record */
  insert: (data: ImgProcFile) => void | Promise<void>;
  /** Update the record for remote file */
  updateMetadata: (data: {
    hash: string;
    format: string;
    width: number;
    height: number;
    r?: number | undefined;
    g?: number | undefined;
    b?: number | undefined;
    expiresAt?: number | undefined;
  }) => void | Promise<void>;
  /** Delete the record */
  delete: (criteria: ImgProcDataAdapterCriteria) => void | Promise<void>;
  /** Renew the record */
  renew: (criteria: ImgProcDataAdapterCriteria) => void | Promise<void>;
  /** Countdown all records */
  countdown: () => void | Promise<void>;
  /**
   * Delete expired records
   * @param now Unixtime (milliseconds)
   * @returns Deleted hashes or null
   */
  deleteExpiredRecords: (
    now: number,
  ) => null | Promise<null> | Set<string> | Promise<Set<string>>;
  /** Close database */
  close: () => void | Promise<void>;
}

// ===============================
// Context
// ===============================

/**
 * Stored directories
 */
export type ImgProcContextDirectories = {
  /** Astro root */
  rootDir: string;
  /** Astro srcDir */
  srcDir: string;
  /** Astro publicDir */
  publicDir: string;
  /** Astro outDir */
  outDir: string;
  /** Astro cacheDir */
  cacheDir: string;
  /** Astro build.assets */
  assetsDirName: string;
  /** Processor imageCacheDir */
  imageCacheDir: string;
  /** Processor downloadDir */
  downloadDir: string;
  /** Processor imageAssetsDirName */
  imageAssetsDirName: string;
  /** Processor imageOutDir */
  imageOutDir: string;
};

/**
 * Global context
 */
export interface ImgProcContext {
  /** Cache database (separated from settings) */
  db: ImgProcDataAdapter;

  /** Directories */
  dirs: ImgProcContextDirectories;

  /** Default component properties */
  componentProps: Omit<ImgProcProcessorOptions, "formatOptions">;
  /** Default format options */
  formatOptions: ImgProcFormatOptions;
  /** Processor general settings */
  settings: Omit<ImgProcSettings, "dataAdapter">;

  /** Logger from Astro */
  logger?: AstroIntegrationLogger | undefined;

  // for debugging
  env?: ConfigEnv;
  resolvedConfig?: ResolvedConfig;
  server?: ViteDevServer;
  pluginContext?: Rollup.PluginContext;
}

// ===============================
// Styles
// ===============================

/**
 * CSS Object grouped by media query
 */
export interface ImgProcCssObj {
  selectors: Record<string, ([string, string] | undefined)[]>;
  media?: string;
}

// ===============================
// Misc.
// ===============================

/**
 * Sharp does not include options in the type by default
 */
export type SharpWithOptions = Sharp & {
  options: Record<string, unknown>;
};

/**
 * Hasher for Buffer and string
 */
export type ImgProcHasher = (buffer: Buffer | string) => string;
