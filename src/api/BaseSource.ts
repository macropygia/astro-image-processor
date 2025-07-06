import fs from "node:fs";
import path from "node:path";

import type { AstroIntegrationLogger } from "astro";
import type { HTMLAttributes } from "astro/types";
import { blue, dim, magenta } from "kleur/colors";
import type { Ora } from "ora";
import ora from "ora";

import { componentTypeToTag } from "../const.js";
import { getTimeStat } from "../integration/utils/getTimeStat.js";
import type {
  ImgProcContext,
  ImgProcContextDirectories,
  ImgProcDataAdapter,
  ImgProcFile,
  ImgProcFormatOptions,
  ImgProcProcessorOptions,
  ImgProcSettings,
  ImgProcVariant,
  ImgProcVariants,
} from "../types.js";
import { addSource } from "./methods/addSource.js";
import { generateBlurredImage } from "./methods/generateBlurredImage.js";
import { generateSourceHash } from "./methods/generateSourceHash.js";
import { generateVariants } from "./methods/generateVariants.js";
import { renewSource } from "./methods/renewSource.js";
import { resolveElementDimensions } from "./methods/resolveElementDimensions.js";
import { resolveSizes } from "./methods/resolveSizes.js";
import { resolveWidths } from "./methods/resolveWidths.js";
import { getBufferFromDataUrl } from "./utils/getBufferFromDataUrl.js";
import { getBufferFromRemoteUrl } from "./utils/getBufferFromRemoteUrl.js";
import { getFilteredSharpOptions } from "./utils/getFilteredSharpOptions.js";
import { normalizePath } from "./utils/normalizePath.js";
import { pathExists } from "./utils/pathExists.js";
import { resolveExpiresAt } from "./utils/resolveExpiresAt.js";
import { resolvePathPattern } from "./utils/resolvePathPattern.js";

export interface BaseSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType: "img" | "picture" | "background";
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class BaseSource {
  componentType: "img" | "picture" | "background";
  /** Component hash */
  componentHash: string | null = null;
  /** Art directive flag */
  isArtDirective = false;
  /** Cache database */
  db: ImgProcDataAdapter;
  /** Available directories */
  dirs: ImgProcContextDirectories;
  /** Sharp output options */
  formatOptions: ImgProcFormatOptions;
  /** Integration settings (incl. default options) */
  settings: Omit<ImgProcSettings, "dataAdapter">;
  /** Global logger */
  logger?: AstroIntegrationLogger | undefined;

  /** Resolved component props */
  options: Omit<
    ImgProcProcessorOptions,
    "width" | "height" | "formatOptions"
  > & {
    src: string;
    width?: number | undefined;
    height?: number | undefined;
  };
  type: "local" | "remote" | "data";

  /** Resolved `src` to handle local file */
  localSourcePath: string;
  /** Download path for remote file */
  downloadPath?: string;

  /** Image file buffer */
  buffer?: Buffer | undefined;
  /** Database record for the image */
  data: Partial<ImgProcFile> = {
    category: "source",
  };
  /** Data URL for blurred image */
  blurredDataUrl?: string;
  /** Variants */
  variants?: ImgProcVariants;

  // Resolved value for element attributes
  resolved: {
    width?: number;
    height?: number;
    widths?: [number, ...number[]];
    densities?: [number, ...number[]];
    sizes?: string;
  } = {};

  spinner: Ora;
  timeStart: number;

  protected constructor({ ctx, componentType, options }: BaseSourceArgs) {
    const {
      logger,
      db,
      dirs,
      settings,
      formatOptions: defaultFormatOptions,
      componentProps: defaultComponentProps,
    } = ctx;

    this.componentType = componentType;
    this.db = db;
    this.dirs = dirs;
    this.settings = settings;
    this.logger = logger;

    // Spinner
    this.timeStart = performance.now();
    this.spinner = ora("Processing...");
    this.spinner.prefixText = blue("[astro-image-processor]");
    this.spinner.prefixText += magenta(` ${componentTypeToTag[componentType]}`);
    this.spinner.prefixText += dim(` ${options.src}`);
    this.spinner.start();

    // Parse component options and set default
    const { src, width, height, formatOptions, ...rest } = options;
    this.formatOptions = { ...defaultFormatOptions, ...formatOptions };
    const availableOptions = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ) as Partial<ImgProcProcessorOptions>;
    this.options = {
      ...defaultComponentProps,
      placeholder: componentType === "background" ? "dominantColor" : "blurred",
      ...availableOptions,
      src,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
    };

    // Parse src
    this.localSourcePath = src;
    if (/^https?:\/\//.test(src)) {
      this.type = "remote";
      this.data.source = src;
    } else if (src.startsWith("data:")) {
      this.type = "data";
      this.data.source = "data";
    } else if (src.startsWith("/@fs")) {
      this.type = "local";
      this.localSourcePath = new URL(src.replace(/^\/@fs/, "file://")).pathname;
    } else if (src.length > 0) {
      this.type = "local";
      this.localSourcePath = normalizePath(
        src.startsWith(`/${this.dirs.assetsDirName}/`)
          ? path.join(this.dirs.outDir, src)
          : path.join(this.dirs.rootDir, src),
      );
    } else {
      throw new Error("Invalid src attribute");
    }
  }

  /** Async constructor */
  static async factory(args: BaseSourceArgs): Promise<BaseSource> {
    const instance = new BaseSource(args);
    try {
      await instance.main();
    } catch (error) {
      instance.spinner.fail("Failed");
      throw error as Error;
    }
    return instance;
  }

  public async main() {
    const {
      options: { placeholder },
      data,
    } = this;

    if (data.hash) {
      throw new Error("Do not initialize more than once");
    }

    // Get hash
    data.hash = await generateSourceHash(this);

    // Find cache
    const currentData = await this.db.fetch({ hash: data.hash });
    if (currentData) {
      Object.assign(data, currentData);
      await renewSource(this);
    } else {
      await addSource(this);
    }
    // await handleSource(this, currentData);

    // Generate blurred image
    if (placeholder === "blurred") {
      this.blurredDataUrl = await generateBlurredImage(this);
    }

    // Resolve `resolved.widths` and `resolved.densities`
    resolveWidths(this);

    // Generate variants
    this.variants = await generateVariants(this);

    // Resolve `resolved.width` and `resolved.height`
    resolveElementDimensions(this);

    // Resolve `resolved.sizes`
    this.resolved.sizes = resolveSizes(this);

    this.spinner.succeed(
      `Completed in ${getTimeStat(this.timeStart, performance.now())}`,
    );
  }

  protected resolvePath(item: ImgProcVariant): string {
    const {
      options: { src },
      settings: {
        imageOutDirPattern,
        disableCopy,
        preserveDirectories,
        fileNamePattern,
      },
      dirs,
      dirs: { outDir, imageCacheDir, imageAssetsDirName },
      resolved,
    } = this;
    const filename = `${item.hash}.${item.ext}`;

    // Dev server
    if (import.meta.env.MODE === "development") {
      return `/_image?href=${encodeURIComponent(
        `/@fs${imageCacheDir}${filename}`,
      )}`;
    }

    // Disable copy (fixed prefix)
    if (import.meta.env.MODE === "production" && disableCopy) {
      return `${imageOutDirPattern}${filename}`;
    }

    // Preserve directories (fixed prefix)
    if (import.meta.env.MODE === "production" && preserveDirectories) {
      const { from, to, toDir, toSrc } = resolvePathPattern({
        src,
        fileNamePattern,
        dirs,
        resolved,
        item,
      });
      fs.mkdirSync(toDir, { recursive: true });
      try {
        fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
      } catch {
        // Skipped
      }
      return toSrc;
    }

    // Static build
    if (import.meta.env.MODE === "production") {
      const from = normalizePath(path.join(imageCacheDir, `${filename}`));
      const toDir = normalizePath(path.join(outDir, imageAssetsDirName), true);
      const to = path.join(toDir, `${filename}`);
      fs.mkdirSync(toDir, { recursive: true });
      try {
        fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
      } catch {
        // Skipped
      }
      return `${imageAssetsDirName}${filename}`;
    }

    // NOTE: SSR not supported
    return `__SSR_NOT_SUPPORTED__${filename}__`;
  }

  /** Return buffer of the source image */
  public async getBuffer(): Promise<Buffer> {
    const {
      options: { src },
      data,
      type,
      localSourcePath,
      downloadPath,
      logger,
    } = this;
    if (this.buffer) {
      return this.buffer;
    }

    // logger?.info(`Load: ${src}`);
    // this.spinner.text = "Loading...";

    if (type === "local") {
      // Local file
      this.buffer = await fs.promises.readFile(localSourcePath);
    } else if (type === "remote" && !downloadPath) {
      // Remote file (new), called by `addSource`
      this.buffer = await this.download();
      // Save the file after `downloadPath` is resolved in the `addSource`
    } else if (type === "remote" && downloadPath) {
      // Remote file (cached), called by `renewSource`
      if (!(await pathExists(downloadPath))) {
        logger?.info("Remote file cache does not exist. Downloading...");
        this.buffer = await this.download();
        await fs.promises.writeFile(downloadPath, this.buffer);
      } else if (!data.expiresAt) {
        // Remote images with cache disabled will not be re-downloaded during that session.
        this.buffer = await fs.promises.readFile(downloadPath);
      } else if (data.expiresAt < Date.now()) {
        logger?.info("Remote file expired. Downloading...");
        this.buffer = await this.download();
        await fs.promises.writeFile(downloadPath, this.buffer);
      } else {
        // Cache exists
        this.buffer = await fs.promises.readFile(downloadPath);
      }
    } else {
      // Data URL (Base64)
      this.buffer = getBufferFromDataUrl(src);
    }
    return this.buffer;
  }

  /** Profile from profile string or processor */
  public get profile():
    | string
    | Record<string, unknown>
    | Record<string, unknown>[]
    | undefined {
    const { processor, profile } = this.options;

    if (!processor) {
      return undefined;
    }
    if (profile) {
      return profile;
    }
    if (Array.isArray(processor)) {
      return processor.map((proc) => getFilteredSharpOptions(proc));
    }
    return getFilteredSharpOptions(processor);
  }

  /** Download remote file and update data */
  protected async download(): Promise<Buffer> {
    const {
      options: { src, minAge, maxAge },
      settings: { timeoutDuration },
      logger,
    } = this;

    const { buffer, expiresAt: rawExpiresAt } = await getBufferFromRemoteUrl(
      src,
      timeoutDuration,
    );
    const expiresAt = resolveExpiresAt({
      expiresAt: rawExpiresAt,
      minAge,
      maxAge,
    });
    Object.assign(this.data, { expiresAt, source: src });

    logger?.info(
      `Download completed: ${src} (Expires at: ${
        expiresAt ? new Date(expiresAt).toLocaleString() : "N/A"
      })`,
    );

    return buffer;
  }

  public get link(): HTMLAttributes<"link"> | null {
    const {
      options: { preload, media, crossOrigin },
      variants,
      resolved,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!preload || !variants || !variants[preload]) {
      return null;
    }
    const attributes = {
      rel: "preload",
      as: "image",
      type: `image/${preload}`,
      ...(media ? { media } : undefined),
      imagesizes: resolved.sizes,
      imagesrcset: (variants[preload] as ImgProcVariant[])
        .map((item) => `${this.resolvePath(item)} ${item.descriptor}`)
        .join(", "),
      ...(crossOrigin ? { crossorigin: crossOrigin } : undefined),
    };
    return attributes;
  }
}

/*
|                     |Bas|Img|Pic|Bak|Art|
|---------------------|---|---|---|---|---|
| extends             | - |Bas|Img|Pic|Bas|
|---------------------|---|---|---|---|---|
| constructor         | * | * | * | < | * |
| factory             | * | * | * | * | * |
| main                | * | < | < | < | < |
| resolvePath         | * | < | < | < | < |
| imageClassList      |   | * | < | < |   |
| imageAttributes     |   | * | < | < |   |
| cssObj              |   | * | < | * | * |
| css                 |   | * | < | < |   |
| containerClassList  |   | * | < | < |   |
| containerAttributes |   | * | < | < |   |
| parseArtDirectives  |   |   | * | < |   |
| pictureClassList    |   |   | * | < |   |
| pictureAttributes   |   |   | * | < |   |
| sources             |   |   | * | < | * |
| links               |   |   | * | < |   |
| backgroundCssObj    |   |   |   |   | * |
| imageSet            |   |   |   | * | * |
|---------------------|---|---|---|---|---|
*/
