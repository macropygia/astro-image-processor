import type {
  ImgProcContext,
  ImgProcCssObj,
  ImgProcFormatOptions,
  ImgProcProcessorOptions,
  ImgProcVariant,
} from "../types.js";
import { PictureSource } from "./PictureSource.js";
import { generateImageSet } from "./methods/generateImageSet.js";

export interface BackgroundSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType?: "img" | "picture" | "background";
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class BackgroundSource extends PictureSource {
  /** Async constructor */
  static override async factory(
    args: BackgroundSourceArgs,
  ): Promise<BackgroundSource> {
    const instance = new BackgroundSource({
      ...args,
      componentType: "background",
    });
    await instance.main();
    await instance.parseArtDirectives();
    return instance;
  }

  public override get cssObj(): ImgProcCssObj | undefined {
    const {
      options: {
        formats,
        placeholder,
        placeholderColor,
        layout,
        backgroundSize,
        backgroundPosition,
        tagName,
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

    const variant = variants[formats.at(-1) as keyof ImgProcFormatOptions];

    if (!variant) {
      throw new Error("Format mismatch");
    }

    const fallbackPath = `${this.resolvePath(
      variant.find((v) => v.width === resolved.width) ||
        (variant.at(-1) as ImgProcVariant),
    )}`;

    return {
      selectors: {
        [`${tagName}[scope]`]: [
          placeholder !== null
            ? [
                "background-color",
                placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`,
              ]
            : undefined,
          ["background-image", `url("${fallbackPath}")`],
          ["background-image", imageSet],
          layout && layout !== "fullWidth"
            ? ["width", `${resolved.width}px`]
            : undefined,
          backgroundSize ? ["background-size", backgroundSize] : undefined,
          backgroundPosition
            ? ["background-position", backgroundPosition]
            : undefined,
          enforceAspectRatio
            ? ["aspect-ratio", `${resolved.width} / ${resolved.height}`]
            : undefined,
        ],
      },
    };
  }

  public get imageSet(): string {
    return generateImageSet.call(this);
  }
}
