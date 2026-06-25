import type { HTMLAttributes } from 'astro/types';

import { BackgroundSource } from '../../api/BackgroundSource.js';
import { ImageSource } from '../../api/ImageSource.js';
import { applyDevFastPath } from '../../api/methods/applyDevFastPath.js';
import { enqueueDevCompressionMisses } from '../../api/methods/enqueueDevCompressionMisses.js';
import { peekBlurPlaceholder } from '../../api/methods/peekBlurPlaceholder.js';
import {
  applyDevPictureFastPath,
  runDevCacheProbe,
  runDevPictureCacheProbe,
} from '../../api/methods/runDevCacheProbe.js';
import { PictureSource } from '../../api/PictureSource.js';
import type { ImgProcContext, ImgProcProcessorOptions } from '../../types.js';

export type DevComponentMode = 'build' | 'fast' | 'slow';

type BaseDevOutput = {
  mode: DevComponentMode;
  css?: string | undefined;
};

export type ImageDevComponentOutput = BaseDevOutput & {
  imageAttributes: HTMLAttributes<'img'>;
  imageClassList: string[];
  containerClassList?: string[] | undefined;
  containerAttributes?: HTMLAttributes<'div'> | undefined;
  link?: HTMLAttributes<'link'> | null | undefined;
};

export type PictureDevComponentOutput = BaseDevOutput & {
  imageAttributes: HTMLAttributes<'img'>;
  imageClassList: string[];
  pictureAttributes: HTMLAttributes<'picture'>;
  pictureClassList: string[];
  sources: HTMLAttributes<'source'>[];
  containerClassList?: string[] | undefined;
  containerAttributes?: HTMLAttributes<'div'> | undefined;
  links?: HTMLAttributes<'link'>[] | null | undefined;
};

export type BackgroundDevComponentOutput = BaseDevOutput & {
  pictureAttributes: Record<string, unknown>;
  pictureClassList: string[];
  links?: HTMLAttributes<'link'>[] | null | undefined;
};

type ResolveImageDevOutputArgs = {
  ctx: ImgProcContext;
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
  asBackground?: boolean | undefined;
};

type ResolvePictureDevOutputArgs = ResolveImageDevOutputArgs;

type ResolveBackgroundDevOutputArgs = {
  ctx: ImgProcContext;
  options: Readonly<Partial<ImgProcProcessorOptions> & { src: string }>;
};

const isDevMode = () => import.meta.env.MODE === 'development';

export async function resolveImageDevOutput({
  ctx,
  options,
  asBackground,
}: ResolveImageDevOutputArgs): Promise<ImageDevComponentOutput> {
  const source = ImageSource.buildImage({ ctx, asBackground, options });

  if (!isDevMode()) {
    try {
      await source.prepare();
      await source.finalize();
    } catch (error) {
      source.spinner.fail('Failed');
      throw error;
    }

    return {
      mode: 'build',
      imageAttributes: source.imageAttributes,
      imageClassList: source.imageClassList,
      containerClassList: source.containerClassList,
      containerAttributes: source.containerAttributes,
      css: source.css,
      link: source.link,
    };
  }

  const probe = await runDevCacheProbe(source);
  if (probe.allHit) {
    applyDevFastPath(source, probe);
    return {
      mode: 'fast',
      imageAttributes: source.imageAttributes,
      imageClassList: source.imageClassList,
      containerClassList: source.containerClassList,
      containerAttributes: source.containerAttributes,
      css: source.css,
      link: source.link,
    };
  }

  const blurPeek = await peekBlurPlaceholder(source);
  if (blurPeek.hit && blurPeek.dataUrl) {
    source.blurredDataUrl = blurPeek.dataUrl;
  }

  enqueueDevCompressionMisses({ source, probe, blurPeek });

  return {
    mode: 'slow',
    imageAttributes: source.placeholderImageAttributes,
    imageClassList: source.imageClassList,
    containerClassList: source.containerClassList,
    containerAttributes: source.containerAttributes,
    css: source.devProvisionalCss,
    link: null,
  };
}

export async function resolvePictureDevOutput({
  ctx,
  options,
  asBackground,
}: ResolvePictureDevOutputArgs): Promise<PictureDevComponentOutput> {
  const source = PictureSource.buildPicture({
    ctx,
    componentType: 'picture',
    asBackground,
    options,
  });

  if (!isDevMode()) {
    try {
      await source.prepare();
      await source.finalize();
    } catch (error) {
      source.spinner.fail('Failed');
      throw error;
    }

    return {
      mode: 'build',
      imageAttributes: source.imageAttributes,
      imageClassList: source.imageClassList,
      pictureAttributes: source.pictureAttributes,
      pictureClassList: source.pictureClassList,
      sources: source.sources,
      containerClassList: source.containerClassList,
      containerAttributes: source.containerAttributes,
      css: source.css,
      links: source.links,
    };
  }

  const probe = await runDevPictureCacheProbe(source);
  if (probe.allHit) {
    applyDevPictureFastPath(source, probe);
    return {
      mode: 'fast',
      imageAttributes: source.imageAttributes,
      imageClassList: source.imageClassList,
      pictureAttributes: source.pictureAttributes,
      pictureClassList: source.pictureClassList,
      sources: source.sources,
      containerClassList: source.containerClassList,
      containerAttributes: source.containerAttributes,
      css: source.css,
      links: source.links,
    };
  }

  const blurPeek = await peekBlurPlaceholder(source);
  if (blurPeek.hit && blurPeek.dataUrl) {
    source.blurredDataUrl = blurPeek.dataUrl;
  }

  if (probe.artDirectives.length) {
    const parentSizes = source.resolved.sizes || '';
    source.artDirectives = probe.artDirectives.map(({ source: adSource }) => {
      adSource.parentSizes = parentSizes;
      return adSource;
    });
  }

  enqueueDevCompressionMisses({
    source,
    probe: probe.mainProbe,
    blurPeek,
    artDirectiveProbes: probe.artDirectives,
  });

  return {
    mode: 'slow',
    imageAttributes: source.placeholderImageAttributes,
    imageClassList: source.imageClassList,
    pictureAttributes: source.placeholderPictureAttributes,
    pictureClassList: source.pictureClassList,
    sources: [],
    containerClassList: source.containerClassList,
    containerAttributes: source.containerAttributes,
    css: source.devProvisionalCss,
    links: null,
  };
}

export async function resolveBackgroundDevOutput({
  ctx,
  options,
}: ResolveBackgroundDevOutputArgs): Promise<BackgroundDevComponentOutput> {
  const source = BackgroundSource.buildBackground({ ctx, options });

  if (!isDevMode()) {
    try {
      await source.prepare();
      await source.finalize();
    } catch (error) {
      source.spinner.fail('Failed');
      throw error;
    }

    return {
      mode: 'build',
      pictureAttributes: source.pictureAttributes,
      pictureClassList: source.pictureClassList,
      css: source.css,
      links: source.links,
    };
  }

  const probe = await runDevCacheProbe(source);
  if (probe.allHit) {
    applyDevFastPath(source, probe);
    return {
      mode: 'fast',
      pictureAttributes: source.pictureAttributes,
      pictureClassList: source.pictureClassList,
      css: source.css,
      links: source.links,
    };
  }

  const blurPeek = await peekBlurPlaceholder(source);
  if (blurPeek.hit && blurPeek.dataUrl) {
    source.blurredDataUrl = blurPeek.dataUrl;
  }

  enqueueDevCompressionMisses({ source, probe, blurPeek });

  return {
    mode: 'slow',
    pictureAttributes: source.placeholderPictureAttributes,
    pictureClassList: source.pictureClassList,
    css: source.devProvisionalCss,
    links: null,
  };
}
