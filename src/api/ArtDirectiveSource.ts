import type { HTMLAttributes } from "astro/types";

import { replicateFitByBg } from "../const.js";
import type {
  ImgProcContext,
  ImgProcCssObj,
  ImgProcFormatOptions,
  ImgProcProcessorOptions,
  ImgProcVariant,
} from "../types.js";
import { BaseSource } from "./BaseSource.js";
import { generateImageSet } from "./methods/generateImageSet.js";
import { CssObjBuilder } from "./utils/CssObjBuilder.js";

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
      options: {
        placeholder,
        placeholderColor,
        media,
        objectFit,
        objectPosition,
        backgroundSize,
        backgroundPosition,
      },
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

    const cssObj = new CssObjBuilder(media);

    if (placeholder === "dominantColor") {
      const value = placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`;
      cssObj.add("picture[scope]::after", ["background-color", value]);
    }

    if (placeholder === "blurred") {
      cssObj.add("picture[scope]::after", [
        "background-image",
        `url("${blurredDataUrl}")`,
      ]);

      // Set the CSS prop `background-size` from the component prop `backgroundSize`
      // or replicate from component prop `objectFit`
      if (backgroundSize !== undefined) {
        if (backgroundSize !== null) {
          cssObj.add("picture[scope]::after", [
            "background-size",
            backgroundSize,
          ]);
        }
      } else if (objectFit) {
        cssObj.add("picture[scope]::after", replicateFitByBg[objectFit]);
      }

      // Set the CSS prop `background-position` from the component prop `backgroundPosition`
      // or replicate from component prop `objectPosition`
      if (backgroundPosition !== undefined) {
        if (backgroundPosition !== null) {
          cssObj.add("picture[scope]::after", [
            "background-position",
            backgroundPosition,
          ]);
        }
      } else {
        cssObj.add("picture[scope]::after", [
          "background-position",
          objectPosition || "50% 50%",
        ]);
      }
    }

    if (objectFit) {
      cssObj.add("img[scope]", ["object-fit", objectFit]);
    }

    if (objectPosition) {
      cssObj.add("img[scope]", ["object-position", objectPosition]);
    }

    return cssObj.value;
  }

  public get backgroundCssObj(): ImgProcCssObj | undefined {
    const {
      options: {
        formats,
        placeholder,
        placeholderColor,
        tagName,
        media,
        objectFit,
        objectPosition,
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

    const cssObj = new CssObjBuilder(media);
    const selector = `${tagName}[scope]`;

    cssObj.add(
      selector,
      ["background-image", `url("${fallbackPath}")`],
      ["background-image", imageSet],
    );

    if (placeholder === "dominantColor") {
      cssObj.add(selector, [
        "background-color",
        placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`,
      ]);
    }

    if (enforceAspectRatio) {
      cssObj.add(selector, [
        "aspect-ratio",
        `${resolved.width} / ${resolved.height}`,
      ]);
    }

    if (objectFit) {
      cssObj.add("img[scope]", ["object-fit", objectFit]);
    }

    if (objectPosition) {
      cssObj.add("img[scope]", ["object-position", objectPosition]);
    }

    return cssObj.value;
  }

  public get imageSet(): string {
    return generateImageSet.call(this);
  }
}
