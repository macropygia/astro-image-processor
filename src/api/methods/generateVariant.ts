import type { AstroIntegrationLogger } from 'astro';
import type { Sharp } from 'sharp';

import type {
  ImgProcDataAdapter,
  ImgProcHasher,
  ImgProcOutputFormat,
  ImgProcVariant,
} from '../../types.js';
import type { ImgProcSpinnerHandle } from '../utils/SharedSpinner.js';
import type { VariantCompressionResult } from '../workers/compressionJobs.js';
import type { CompressionPool } from '../workers/compressionPool.js';
import { serializeSourceProfiles } from './serializeSourceProfiles.js';

type RunVariantCompressionJobArgs = {
  buffer: Buffer;
  imageCacheDir: string;
  processor: Sharp | Sharp[] | undefined;
  variantWidth: number;
  variantFormat: ImgProcOutputFormat;
  variantFormatOptions?: Record<string, unknown> | undefined;
  compressionPool: CompressionPool;
};

export const runVariantCompressionJob = ({
  buffer,
  imageCacheDir,
  processor,
  variantWidth,
  variantFormat,
  variantFormatOptions,
  compressionPool,
}: RunVariantCompressionJobArgs): Promise<VariantCompressionResult> =>
  compressionPool.runVariant({
    buffer,
    imageCacheDir,
    sourceProfiles: serializeSourceProfiles(processor),
    variantWidth,
    variantFormat,
    variantFormatOptions: variantFormatOptions ?? {},
  });

type InsertVariantRecordArgs = {
  db: ImgProcDataAdapter;
  result: VariantCompressionResult;
  sourceHash: string;
  variantProfileHash: string;
};

export const insertVariantRecord = async ({
  db,
  result,
  sourceHash,
  variantProfileHash,
}: InsertVariantRecordArgs): Promise<void> => {
  await db.insert({
    hash: result.hash,
    category: 'variant',
    format: result.format,
    width: result.width,
    height: result.height,
    source: sourceHash,
    profile: variantProfileHash,
  });
};

export const toImgProcVariant = (
  result: VariantCompressionResult,
  variantWidth: number,
  variantDensity?: number,
): ImgProcVariant => ({
  hash: result.hash,
  width: result.width,
  height: result.height,
  format: result.format,
  ext: result.ext,
  descriptor: variantDensity ? `${variantDensity}x` : `${variantWidth}w`,
});

type GenerateVariant = (args: {
  src: string;
  buffer: Buffer;
  db: ImgProcDataAdapter;
  hasher: ImgProcHasher;
  imageCacheDir: string;
  processor: Sharp | Sharp[] | undefined;
  variantWidth: number;
  variantFormat: ImgProcOutputFormat;
  variantFormatOptions?: Record<string, unknown> | undefined;
  variantProfileHash: string;
  sourceHash: string;
  variantDensity?: number | undefined;
  logger?: AstroIntegrationLogger | undefined;
  spinner: ImgProcSpinnerHandle;
  compressionPool: CompressionPool;
}) => Promise<ImgProcVariant>;

/** Build path: await compression and persist before returning the variant record. */
export const generateVariant: GenerateVariant = async ({
  buffer,
  db,
  imageCacheDir,
  processor,
  variantWidth,
  variantFormat,
  variantFormatOptions,
  variantProfileHash,
  sourceHash,
  variantDensity,
  compressionPool,
}) => {
  const result = await runVariantCompressionJob({
    buffer,
    imageCacheDir,
    processor,
    variantWidth,
    variantFormat,
    variantFormatOptions,
    compressionPool,
  });

  await insertVariantRecord({
    db,
    result,
    sourceHash,
    variantProfileHash,
  });

  return toImgProcVariant(result, variantWidth, variantDensity);
};
