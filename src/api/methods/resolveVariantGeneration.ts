import type { AstroIntegrationLogger } from 'astro';
import type { Sharp } from 'sharp';

import type { ImgProcOutputFormat, ImgProcVariant } from '../../types.js';
import type { BaseSource } from '../BaseSource.js';
import { getOrCreateInflightVariant, variantInflightKey } from '../utils/variantInflight.js';
import { noteVariantCompleted, noteVariantQueued } from '../utils/variantSpinnerProgress.js';
import { generateVariant } from './generateVariant.js';
import { retrieveVariant } from './retrieveVariant.js';

type ResolveVariantGenerationArgs = {
  source: BaseSource;
  sourceHash: string;
  variantProfileHash: string;
  src: string;
  variantFormat: ImgProcOutputFormat;
  variantFormatOptions?: Record<string, unknown> | undefined;
  variantWidth: number;
  variantDensity?: number | undefined;
  imageCacheDir: string;
  processor: Sharp | Sharp[] | undefined;
  hasher: BaseSource['settings']['hasher'];
  logger?: AstroIntegrationLogger | undefined;
};

const variantGenerationResolutions = new Map<string, Promise<ImgProcVariant>>();

export const clearVariantGenerationResolutions = () => {
  variantGenerationResolutions.clear();
};

/** Build path: one cache lookup + generation task per source/profile key. */
export const resolveVariantGeneration = (
  args: ResolveVariantGenerationArgs,
): Promise<ImgProcVariant> => {
  const { sourceHash, variantProfileHash } = args;
  const key = variantInflightKey(sourceHash, variantProfileHash);

  const existing = variantGenerationResolutions.get(key);
  if (existing) {
    return existing;
  }

  const resolution = resolveVariantGenerationOnce(args);
  variantGenerationResolutions.set(key, resolution);
  void resolution.finally(() => {
    if (variantGenerationResolutions.get(key) === resolution) {
      variantGenerationResolutions.delete(key);
    }
  });
  return resolution;
};

const resolveVariantGenerationOnce = async (
  args: ResolveVariantGenerationArgs,
): Promise<ImgProcVariant> => {
  const {
    source,
    sourceHash,
    variantProfileHash,
    src,
    variantFormat,
    variantFormatOptions,
    variantWidth,
    variantDensity,
    imageCacheDir,
    processor,
    hasher,
    logger,
  } = args;

  const variantKey = variantInflightKey(sourceHash, variantProfileHash);

  const itemFromCache = await retrieveVariant({
    src,
    db: source.db,
    sourceHash,
    variantProfileHash,
    imageCacheDir,
    variantWidth,
    variantDensity,
    logger,
    spinner: source.spinner,
  });

  if (itemFromCache) {
    return itemFromCache;
  }

  return getOrCreateInflightVariant(sourceHash, variantProfileHash, () => {
    noteVariantQueued(variantKey, source.spinner);
    const task = (async () => {
      const buffer = await source.getBuffer();
      return generateVariant({
        src,
        buffer,
        db: source.db,
        hasher,
        imageCacheDir,
        processor,
        variantWidth,
        variantFormat,
        variantFormatOptions,
        variantProfileHash,
        sourceHash,
        variantDensity,
        logger,
        spinner: source.spinner,
        compressionPool: source.compressionPool,
      });
    })().finally(() => {
      noteVariantCompleted(variantKey, source.spinner);
    });
    return task;
  });
};
