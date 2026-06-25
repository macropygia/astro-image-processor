import type { ImgProcOutputFormat } from '../../types.js';

export type { VariantWorkerBlurJob, VariantWorkerVariantJob } from './variantWorkerJobs.js';
export { formatOptionsFromSharpState } from './variantWorkerJobs.js';

export type VariantCompressionResult = {
  hash: string;
  width: number;
  height: number;
  format: ImgProcOutputFormat;
  ext: string;
};

export type BlurCompressionResult = {
  hash: string;
  base64: string;
  format: ImgProcOutputFormat;
  width: number;
  height: number;
};

export type VariantCompressionJob = {
  type: 'variant';
  buffer: Buffer;
  imageCacheDir: string;
  sourceProfiles: Record<string, unknown>[];
  variantWidth: number;
  variantFormat: ImgProcOutputFormat;
  variantFormatOptions: Record<string, unknown>;
};

export type BlurCompressionJob = {
  type: 'blur';
  buffer: Buffer;
  sourceProfiles: Record<string, unknown>[];
  resizeWidth: number;
  format: ImgProcOutputFormat;
  formatOptions: Record<string, unknown>;
};

export type CompressionJob = VariantCompressionJob | BlurCompressionJob;
