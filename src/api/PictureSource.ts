import type { HTMLAttributes } from "astro/types";

import { defaultGlobalClassNames } from "../const.js";
import type { ImgProcContext, ImgProcProcessorOptions } from "../types.js";
import { ArtDirectiveSource } from "./ArtDirectiveSource.js";
import { ImageSource } from "./ImageSource.js";
import { generateComponentHash } from "./methods/generateComponentHash.js";

export interface PictureSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType?: "img" | "picture" | "background";
  /** Container mode */
  asBackground?: boolean | undefined;
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class PictureSource extends ImageSource {
  /** For art directives */
  ctx: ImgProcContext;

  protected constructor({
    ctx,
    componentType,
    asBackground,
    options,
  }: PictureSourceArgs & { componentType: "img" | "picture" | "background" }) {
    super({ ctx, componentType, asBackground, options });

    const {
      settings: { hasher },
    } = ctx;
    this.ctx = ctx;
    this.componentHash = generateComponentHash(
      { componentType, ...(asBackground ? { asBackground } : {}), ...options },
      hasher,
    );
  }

  /** Async constructor */
  static override async factory(
    args: PictureSourceArgs,
  ): Promise<PictureSource> {
    const instance = new PictureSource({ ...args, componentType: "picture" });
    await instance.main();
    await instance.parseArtDirectives();
    return instance;
  }

  protected async parseArtDirectives() {
    const { artDirectives, tagName } = this.options;
    if (!artDirectives) {
      return;
    }
    this.artDirectives = await Promise.all(
      artDirectives.map((artDirective) =>
        ArtDirectiveSource.factory({
          ctx: this.ctx,
          componentType: this.componentType,
          componentHash: this.componentHash,
          options: { ...artDirective, ...(tagName ? { tagName } : undefined) },
        }),
      ),
    );
  }

  public get pictureClassList(): string[] {
    const {
      options: { layout },
      settings: { globalClassNames, scopedStyleStrategy },
      asBackground,
      componentType,
      componentHash,
    } = this;

    const classList: string[] = [globalClassNames.element[componentType]];

    if (scopedStyleStrategy !== "attribute") {
      classList.push(`astro-aip-${componentHash}`);
    }

    if (asBackground) {
      classList.push(globalClassNames.element.asBackground);
    }

    if (layout) {
      classList.push(defaultGlobalClassNames.layout[layout]);
    }

    return classList;
  }

  public get pictureAttributes(): HTMLAttributes<"picture"> {
    // data-astro-aip-<hash>
    const dataIdentifier =
      this.settings.scopedStyleStrategy === "attribute"
        ? { [`data-astro-aip-${this.componentHash}`]: true }
        : undefined;

    return {
      ...dataIdentifier,
    };
  }

  public get sources(): HTMLAttributes<"source">[] {
    const {
      options: { formats },
      variants,
      resolved,
      artDirectives,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!variants || !resolved.width || !resolved.height) {
      throw new Error("Unresolved source");
    }

    if (formats.length < 2) {
      return [];
    }

    const sources: HTMLAttributes<"source">[] = [];

    if (artDirectives) {
      // biome-ignore lint/complexity/noForEach: Not complex
      artDirectives
        .flatMap((ad) => ad.sources)
        .forEach((ads) => sources.push(ads));
    }

    const additionalFormats = formats.slice(0, -1);
    // biome-ignore lint/complexity/noForEach: Not complex
    additionalFormats
      .map((format) => {
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
        };
      })
      .forEach((source) => sources.push(source));

    return sources;
  }

  public get links(): HTMLAttributes<"link">[] | null {
    const links: HTMLAttributes<"link">[] = [];
    const { artDirectives, link } = this;

    if (link) {
      links.push(link);
    } else {
      return null;
    }

    if (artDirectives) {
      // biome-ignore lint/complexity/noForEach: Not complex
      (
        artDirectives
          .map((ad) => ad.link)
          .filter(Boolean) as HTMLAttributes<"link">[]
      ).forEach((link) => links.push(link));
    }

    return links;
  }
}
