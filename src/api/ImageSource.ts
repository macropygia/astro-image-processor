import type { HTMLAttributes } from "astro/types";

import { defaultGlobalClassNames, replicateFitByBg } from "../const.js";
import type {
  ImgProcContext,
  ImgProcCssObj,
  ImgProcProcessorOptions,
  ImgProcVariant,
} from "../types.js";
import type { ArtDirectiveSource } from "./ArtDirectiveSource.js";
import { BaseSource } from "./BaseSource.js";
import { generateComponentHash } from "./methods/generateComponentHash.js";
import { CssObjBuilder } from "./utils/CssObjBuilder.js";
import { parseCssObj } from "./utils/parseCssObj.js";

export interface ImageSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType?: "img" | "picture" | "background";
  /** Container mode */
  asBackground?: boolean | undefined;
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class ImageSource extends BaseSource {
  /** Art directives */
  artDirectives: ArtDirectiveSource[] | null = null;
  /** Component hash */
  override componentHash: string;
  /** Container mode */
  asBackground?: boolean | undefined;

  protected constructor({
    ctx,
    componentType,
    asBackground,
    options,
  }: ImageSourceArgs & { componentType: "img" | "picture" | "background" }) {
    super({ ctx, componentType, options });

    const {
      settings: { hasher },
    } = ctx;
    this.componentType = componentType;
    this.asBackground = asBackground;
    this.componentHash = generateComponentHash(
      { componentType, ...(asBackground ? { asBackground } : {}), ...options },
      hasher,
    );
  }

  /** Async constructor */
  static override async factory(args: ImageSourceArgs): Promise<ImageSource> {
    const instance = new ImageSource({ ...args, componentType: "img" });
    await instance.main();
    return instance;
  }

  public get imageClassList(): string[] {
    const {
      options: { layout },
      settings: { globalClassNames, scopedStyleStrategy },
      asBackground,
      componentHash,
    } = this;

    const classList: string[] = [globalClassNames.element.img];

    if (scopedStyleStrategy !== "attribute") {
      classList.push(`astro-aip-${componentHash}`);
    }

    if (layout && !asBackground) {
      classList.push(defaultGlobalClassNames.layout[layout]);
    }

    if (asBackground) {
      classList.push(globalClassNames.element.asBackground);
    }

    return classList;
  }

  public get imageAttributes(): HTMLAttributes<"img"> {
    const {
      options: { format, formats, placeholder },
      settings: { scopedStyleStrategy, globalClassNames },
      resolved: { width, height, sizes },
      variants,
      componentHash,
      componentType,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!variants || !width || !height) {
      throw new Error("Unresolved source");
    }

    // const ext = extByFormat[format || formats.at(-1)];
    const variant = variants[format || formats.at(-1)];

    if (!variant) {
      throw new Error("Format mismatch");
    }

    // src
    const src = `${this.resolvePath(
      variant.find((v) => v.width === width) ||
        (variant.at(-1) as ImgProcVariant),
    )}`;

    // data-astro-aip-<hash>
    const dataIdentifier =
      scopedStyleStrategy === "attribute"
        ? { [`data-astro-aip-${componentHash}`]: true }
        : undefined;

    // placeholder animation
    const onLoad =
      componentType === "picture" && placeholder !== null
        ? {
            onload: `parentElement.style.setProperty('${globalClassNames.cssVariables.placeholderAnimationState}', 'running');`,
          }
        : undefined;

    return {
      src,
      srcset: variant
        .map((item) => `${this.resolvePath(item)} ${item.descriptor}`)
        .join(", "),
      width,
      height,
      sizes,
      ...dataIdentifier,
      ...onLoad,
    };
  }

  public get cssObj(): ImgProcCssObj | undefined {
    const {
      options: {
        placeholder,
        placeholderColor,
        objectFit,
        objectPosition,
        backgroundSize,
        backgroundPosition,
        layout,
        enforceAspectRatio,
        tagName,
      },
      settings: { globalClassNames },
      resolved,
      componentType,
      blurredDataUrl,
      asBackground,
      data,
    } = this;

    const cssObj = new CssObjBuilder();

    if (placeholder === "dominantColor") {
      cssObj.add("img[scope]", [
        "background-color",
        placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`,
      ]);
      if (componentType === "picture") {
        // Both overlay and img element have placeholder in the picture element
        cssObj.add("picture[scope]::after", [
          "background-color",
          placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`,
        ]);
      }
    }

    if (placeholder === "blurred") {
      cssObj.add(
        "img[scope]",
        ["background-size", "cover"],
        // inherit from object-position (default: "50% 50%")
        ["background-position", objectPosition || "50% 50%"],
      );
      if (componentType === "picture") {
        // Both overlay and img element have placeholder in the picture element
        cssObj.add("picture[scope]", [
          globalClassNames.cssVariables.blurredImage,
          `url("${blurredDataUrl}")`,
        ]);
        cssObj.add("picture[scope]::after", [
          "background-image",
          `var(${globalClassNames.cssVariables.blurredImage})`,
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

        // blurred image inherit from picture element in the picture component
        cssObj.add("img[scope]", [
          "background-image",
          `var(${globalClassNames.cssVariables.blurredImage})`,
        ]);
      } else {
        // blurred image assign directly in the image component
        cssObj.add("img[scope]", [
          "background-image",
          `url("${blurredDataUrl}")`,
        ]);
      }
    }

    if (
      asBackground &&
      layout &&
      (layout === "constrained" || layout === "fixed")
    ) {
      cssObj.add(`${tagName}[scope]`, ["width", `${resolved.width}px`]);
    }

    if (objectFit) {
      cssObj.add("img[scope]", ["object-fit", objectFit]);
    }

    if (objectPosition) {
      cssObj.add("img[scope]", ["object-position", objectPosition]);
    }

    if (asBackground && enforceAspectRatio) {
      cssObj.add(`${tagName}[scope]`, [
        "aspect-ratio",
        `${resolved.width} / ${resolved.height}`,
      ]);
    }

    return cssObj.value;
  }

  public get css(): string {
    const {
      settings: { scopedStyleStrategy },
      componentHash,
      artDirectives,
      cssObj,
    } = this;

    const styles: (ImgProcCssObj | undefined)[] = [];

    styles.push(cssObj);

    // For picture only
    if (artDirectives) {
      for (const ad of artDirectives) {
        styles.push(ad.cssObj);
      }
    }

    const css = parseCssObj({
      componentHash,
      scopedStyleStrategy,
      styles,
    });

    return css;
  }

  public get containerClassList(): string[] {
    const {
      options: { layout },
      settings: { globalClassNames, scopedStyleStrategy },
      componentHash,
      asBackground,
    } = this;

    if (!asBackground) {
      return [];
    }

    const classList: string[] = [globalClassNames.element.container];

    if (scopedStyleStrategy !== "attribute") {
      classList.push(`astro-aip-${componentHash}`);
    }

    if (layout) {
      classList.push(defaultGlobalClassNames.layout[layout]);
    }

    return classList;
  }

  public get containerAttributes(): Record<string, unknown> {
    const {
      settings: { scopedStyleStrategy },
      componentHash,
      asBackground,
    } = this;

    if (!asBackground) {
      return {};
    }

    // data-astro-aip-<hash>
    const dataIdentifier =
      scopedStyleStrategy === "attribute"
        ? { [`data-astro-aip-${componentHash}`]: true }
        : undefined;

    return {
      ...dataIdentifier,
    };
  }
}
