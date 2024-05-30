import type { HTMLAttributes } from "astro/types";

import type {
  ImgProcContext,
  ImgProcCssObj,
  ImgProcFormatOptions,
  ImgProcProcessorOptions,
  ImgProcVariant,
} from "../types.js";
import { BaseSource } from "./BaseSource.js";
import { generateImageSet } from "./methods/generateImageSet.js";

export interface ArtDirectiveSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType: "img" | "picture" | "background";
  /** Component hash (inherit from PictureSource/BackgroundSource) */
  componentHash: string;
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class ArtDirectiveSource extends BaseSource {
  /** Component hash */
  override readonly componentHash: string;

  protected constructor(args: ArtDirectiveSourceArgs) {
    super(args);

    this.isArtDirective = true;
    this.componentHash = args.componentHash;
  }

  /** Async constructor */
  static override async factory(args: ArtDirectiveSourceArgs) {
    const instance = new ArtDirectiveSource(args);
    await instance.main();
    return instance;
  }

  public get sources(): HTMLAttributes<"source">[] {
    const {
      options: { formats, media },
      variants,
      resolved,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!variants || !resolved.width || !resolved.height) {
      throw new Error("Unresolved source");
    }

    if (!media) {
      throw new Error("Media query does not exist");
    }

    const sources = formats.map((format) => {
      const variant = variants[format];
      if (!variant) {
        throw new Error("Format mismatch");
      }
      return {
        srcset: variant
          .map((item) => `${this.resolvePath(item)} ${item.descriptor}`)
          .join(", "),
        width: resolved.width,
        height: resolved.height,
        type: `image/${format}`,
        media,
      };
    });

    return sources;
  }

  public get cssObj(): ImgProcCssObj | undefined {
    const {
      options: { placeholder, placeholderColor, media },
      componentType,
      data,
      blurredDataUrl,
      backgroundCssObj,
    } = this;

    if (componentType === "background") {
      return backgroundCssObj;
    }

    if (!media) {
      throw new Error("Media query does not exist");
    }

    if (placeholder === "dominantColor") {
      const value = placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`;
      return {
        media,
        selectors: {
          "picture[scope]::after": [["background-color", value]],
        },
      };
    }

    if (placeholder === "blurred") {
      return {
        media,
        selectors: {
          "picture[scope]::after": [
            ["background-size", "cover"],
            ["background-image", `url("${blurredDataUrl}")`],
            ["background-position", "50% 50%"],
          ],
        },
      };
    }

    return undefined;
  }

  public get backgroundCssObj(): ImgProcCssObj | undefined {
    const {
      options: {
        formats,
        placeholder,
        placeholderColor,
        tagName,
        media,
        enforceAspectRatio,
      },
      variants,
      resolved,
      data,
      imageSet,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!variants || !resolved.width || !resolved.height) {
      throw new Error("Unresolved source");
    }

    if (!media) {
      throw new Error("Media query does not exist");
    }

    const variant = variants[formats.at(-1) as keyof ImgProcFormatOptions];

    if (!variant) {
      throw new Error("Format mismatch");
    }

    const fallbackPath = `${this.resolvePath(
      variant.find((v) => v.width === resolved.width) ||
        (variant.at(-1) as ImgProcVariant),
    )}`;

    const selector = `${tagName}[scope]`;

    const cssObj: ImgProcCssObj = {
      media,
      selectors: {
        [selector]: [
          ["background-image", `url("${fallbackPath}")`],
          ["background-image", imageSet],
        ],
      },
    };

    if (placeholder === "dominantColor") {
      cssObj.selectors[selector]?.push([
        "background-color",
        placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`,
      ]);
    }

    if (enforceAspectRatio) {
      cssObj.selectors[selector] = cssObj.selectors[selector] || [];
      cssObj.selectors[selector]?.push([
        "aspect-ratio",
        `${resolved.width} / ${resolved.height}`,
      ]);
    }

    return cssObj;
  }

  public get imageSet(): string {
    return generateImageSet.call(this);
  }
}
