import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import sharp, { type Metadata } from 'sharp';

import { normalizePath } from '../utils/normalizePath.ts';
import { resolveSharpFormat } from '../utils/resolveSharpFormat.ts';
import { applySharpProfiles } from './applySharpProfiles.ts';
import type {
  BlurCompressionJob,
  BlurCompressionResult,
  CompressionJob,
  VariantCompressionJob,
  VariantCompressionResult,
} from './compressionJobs.ts';

const extByFormat = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
} as const;

type WorkerOutputFormat = keyof typeof extByFormat;

const isOutputFormat = (format: string): format is WorkerOutputFormat => format in extByFormat;

const hashBuffer = (buffer: Buffer) => crypto.hash('md5', buffer);

const resolveWorkerOutputFormat = (metadata: Metadata): WorkerOutputFormat => {
  const sharpFormat = metadata.format;
  if (!sharpFormat) {
    throw new Error('Invalid output format');
  }

  const format = resolveSharpFormat(sharpFormat, metadata.compression);
  if (!isOutputFormat(format)) {
    throw new Error('Invalid output format');
  }

  return format;
};

const runVariantJob = async (job: VariantCompressionJob): Promise<VariantCompressionResult> => {
  const prepared = await applySharpProfiles(job.buffer, job.sourceProfiles);
  const variantBuffer = await sharp(prepared)
    .resize(job.variantWidth)
    .toFormat(job.variantFormat, job.variantFormatOptions)
    .toBuffer();

  const metadata = await sharp(variantBuffer).metadata();
  const format = resolveWorkerOutputFormat(metadata);

  const hash = hashBuffer(variantBuffer);
  const ext = extByFormat[format];
  const imageCachePath = normalizePath(path.join(job.imageCacheDir, `${hash}.${ext}`));
  await fs.promises.writeFile(imageCachePath, variantBuffer);

  return {
    hash,
    width: metadata.width ?? job.variantWidth,
    height: metadata.height ?? metadata.width ?? job.variantWidth,
    format,
    ext,
  };
};

const runBlurJob = async (job: BlurCompressionJob): Promise<BlurCompressionResult> => {
  const prepared = await applySharpProfiles(job.buffer, job.sourceProfiles);
  const blurredBuffer = await sharp(prepared)
    .resize(job.resizeWidth)
    .toFormat(job.format, job.formatOptions)
    .toBuffer();

  const metadata = await sharp(blurredBuffer).metadata();
  const format = resolveWorkerOutputFormat(metadata);

  return {
    hash: hashBuffer(blurredBuffer),
    base64: blurredBuffer.toString('base64'),
    format,
    width: metadata.width ?? job.resizeWidth,
    height: metadata.height ?? job.resizeWidth,
  };
};

export default async function runCompressionJob(
  job: CompressionJob,
): Promise<VariantCompressionResult | BlurCompressionResult> {
  return job.type === 'blur' ? runBlurJob(job) : runVariantJob(job);
}
