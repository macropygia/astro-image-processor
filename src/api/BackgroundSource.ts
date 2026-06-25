import type {
  ImgProcContext,
  ImgProcCssObj,
  ImgProcFormatOptions,
  ImgProcProcessorOptions,
  ImgProcVariant,
} from '../types.js';
import { generateImageSet } from './methods/generateImageSet.js';
import { resolveProvisionalLayout } from './methods/prepareDevProvisionalState.js';
import { PictureSource } from './PictureSource.js';
import { CssObjBuilder } from './utils/CssObjBuilder.js';
import { parseCssObj } from './utils/parseCssObj.js';

export interface BackgroundSourceArgs {
  /** Integration context */
  ctx: ImgProcContext;
  /** Component type */
  componentType?: 'img' | 'picture' | 'background';
  /** Component props (readonly) */
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
}

export class BackgroundSource extends PictureSource {
  /** Create instance without running prepare/finalize */
  static buildBackground(args: BackgroundSourceArgs) {
    return new BackgroundSource({
      ...args,
      componentType: 'background',
    });
  }

  /** Async constructor */
  static override async factory(args: BackgroundSourceArgs): Promise<BackgroundSource> {
    const instance = new BackgroundSource({
      ...args,
      componentType: 'background',
    });
    try {
      await instance.prepare();
      await instance.finalize();
    } catch (error) {
      instance.spinner.fail('Failed');
      throw error as Error;
    }
    return instance;
  }

  public override get devProvisionalCss(): string {
    if (!this.resolved.width || !this.resolved.height) {
      resolveProvisionalLayout(this);
    }

    const {
      settings: { scopedStyleStrategy },
      componentHash,
    } = this;

    return parseCssObj({
      componentHash,
      scopedStyleStrategy,
      styles: [this.placeholderCssObj],
    });
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
      throw new Error('Unresolved source');
    }

    const variant = variants[formats.at(-1) as keyof ImgProcFormatOptions];

    if (!variant) {
      throw new Error('Format mismatch');
    }

    const fallbackPath = `${this.resolvePath(
      variant.find((v) => v.width === resolved.width) || (variant.at(-1) as ImgProcVariant),
    )}`;

    const cssObj = new CssObjBuilder();

    cssObj.add(
      `${tagName}[scope]`,
      placeholder !== null
        ? ['background-color', placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`]
        : undefined,
      ['background-image', `url("${fallbackPath}")`],
      ['background-image', imageSet],
      layout && (layout === 'constrained' || layout === 'fixed')
        ? ['width', `${resolved.width}px`]
        : undefined,
      backgroundSize ? ['background-size', backgroundSize] : undefined,
      backgroundPosition ? ['background-position', backgroundPosition] : undefined,
      enforceAspectRatio ? ['aspect-ratio', `${resolved.width} / ${resolved.height}`] : undefined,
    );

    return cssObj.value;
  }

  public get imageSet(): string {
    return generateImageSet.call(this);
  }

  public override get placeholderCss(): string {
    if (!this.prepared) {
      throw new Error('prepare() must be called before placeholderCss');
    }

    this.ensureProvisionalResolution();

    const {
      settings: { scopedStyleStrategy },
      componentHash,
    } = this;

    const styles: (ImgProcCssObj | undefined)[] = [this.placeholderCssObj];

    return parseCssObj({
      componentHash,
      scopedStyleStrategy,
      styles,
    });
  }

  public get placeholderCssObj(): ImgProcCssObj | undefined {
    const {
      options: {
        placeholder,
        placeholderColor,
        layout,
        backgroundSize,
        backgroundPosition,
        tagName,
        enforceAspectRatio,
      },
      resolved,
      data,
    } = this;

    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!resolved.width || !resolved.height) {
      throw new Error('Unresolved provisional dimensions');
    }

    const cssObj = new CssObjBuilder();

    cssObj.add(
      `${tagName}[scope]`,
      placeholder !== null
        ? ['background-color', placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`]
        : undefined,
      layout && (layout === 'constrained' || layout === 'fixed')
        ? ['width', `${resolved.width}px`]
        : undefined,
      backgroundSize ? ['background-size', backgroundSize] : undefined,
      backgroundPosition ? ['background-position', backgroundPosition] : undefined,
      enforceAspectRatio ? ['aspect-ratio', `${resolved.width} / ${resolved.height}`] : undefined,
    );

    return cssObj.value;
  }

  public override get placeholderPictureAttributes(): Record<string, unknown> {
    const attributes: Record<string, unknown> = {
      ...this.pictureAttributes,
    };

    if (import.meta.env.MODE === 'development') {
      const {
        options: { devPlaceholder, src, backgroundSize, backgroundPosition },
        resolved: { width, height },
      } = this;
      const aspectRatio = width && height ? `aspect-ratio:${width}/${height};` : '';

      if (devPlaceholder === 'source') {
        const bgSize = backgroundSize ?? 'cover';
        const bgPos = backgroundPosition ?? '50% 50%';
        attributes.style = `background-image:url("${src}");background-size:${bgSize};background-position:${bgPos};${aspectRatio}`;
      } else if (aspectRatio) {
        attributes.style = aspectRatio;
      }
    }

    return attributes;
  }
}
