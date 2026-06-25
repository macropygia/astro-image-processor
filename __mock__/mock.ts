import type { AstroConfig, AstroIntegrationLogger } from 'astro';
import sharp from 'sharp';
import { vi } from 'vitest';

import { SharedSpinner } from '../src/api/utils/SharedSpinner.js';
import type {
  BlurCompressionResult,
  VariantCompressionResult,
} from '../src/api/workers/compressionJobs.js';
import type { CompressionPool } from '../src/api/workers/compressionPool.js';
import type {
  ImgProcContext,
  ImgProcDataAdapter,
  ImgProcDataAdapterInitOptions,
  ImgProcFile,
  ImgProcOutputFormat,
  ImgProcUserOptions,
  ImgProcVariants,
} from '../src/types.js';

export const mockAstroConfig = {
  root: new URL('file:///mock/root/'),
  srcDir: new URL('file:///mock/root/src/'),
  publicDir: new URL('file:///mock/root/public/'),
  outDir: new URL('file:///mock/root/dist/'),
  cacheDir: new URL('file:///mock/root/cache/'),
  scopedStyleStrategy: 'attribute',
  build: {
    assets: '_astro',
  },
} as Partial<AstroConfig> as AstroConfig;

export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as Partial<AstroIntegrationLogger> as AstroIntegrationLogger;

const runVariantSync = async (
  buffer: Buffer,
  job: {
    sourceProfiles: Record<string, unknown>[];
    variantWidth: number;
    variantFormat: ImgProcOutputFormat;
    variantFormatOptions: Record<string, unknown>;
  },
): Promise<VariantCompressionResult> => {
  let prepared = buffer;
  for (const profile of job.sourceProfiles) {
    prepared = await sharp(prepared)
      .pipe(sharp(profile as never))
      .toBuffer();
  }
  const variantBuffer = await sharp(prepared)
    .resize(job.variantWidth)
    .toFormat(job.variantFormat, job.variantFormatOptions)
    .toBuffer();
  const metadata = await sharp(variantBuffer).metadata();
  const format = metadata.format as ImgProcOutputFormat;
  return {
    hash: `hash-${format}-${metadata.width}`,
    width: metadata.width ?? job.variantWidth,
    height: metadata.height ?? job.variantWidth,
    format,
    ext: format === 'jpeg' ? 'jpg' : format,
  };
};

const runBlurSync = async (
  buffer: Buffer,
  job: {
    sourceProfiles: Record<string, unknown>[];
    resizeWidth: number;
    format: ImgProcOutputFormat;
    formatOptions: Record<string, unknown>;
  },
): Promise<BlurCompressionResult> => {
  let prepared = buffer;
  for (const profile of job.sourceProfiles) {
    prepared = await sharp(prepared)
      .pipe(sharp(profile as never))
      .toBuffer();
  }
  const blurredBuffer = await sharp(prepared)
    .resize(job.resizeWidth)
    .toFormat(job.format, job.formatOptions)
    .toBuffer();
  const metadata = await sharp(blurredBuffer).metadata();
  const format = metadata.format as ImgProcOutputFormat;
  return {
    hash: `blur-${format}`,
    base64: blurredBuffer.toString('base64'),
    format,
    width: metadata.width ?? job.resizeWidth,
    height: metadata.height ?? job.resizeWidth,
  };
};

export const createSyncCompressionPool = () =>
  ({
    queueSize: 0,
    pending: 0,
    runVariant: (job: Parameters<typeof runVariantSync>[1] & { buffer: Buffer }) =>
      runVariantSync(job.buffer, job),
    runBlur: (job: Parameters<typeof runBlurSync>[1] & { buffer: Buffer }) =>
      runBlurSync(job.buffer, job),
    onIdle: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  }) as unknown as CompressionPool;

export const mockDb = {
  fetch: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  countdown: vi.fn(),
  deleteExpiredRecords: vi.fn(),
  delete: vi.fn(),
  close: vi.fn(),
} as unknown as ImgProcDataAdapter;

export const mockContext = {
  logger: mockLogger,
  db: mockDb,
  dirs: {
    assetsDirName: 'assets',
    outDir: 'out/',
    rootDir: 'root/',
    imageCacheDir: 'cache/',
    imageAssetsDirName: 'img/',
    imageOutDir: 'out/img/',
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  limit: vi.fn(() => (fn: any) => fn()),
  settings: {
    disableCopy: false,
    hasher: vi.fn(),
    scopedStyleStrategy: 'attribute',
    devServerImageEndpoint: '/_aip',
  },
  formatOptions: {},
  componentProps: {},
  compressionPool: createSyncCompressionPool(),
  sharedSpinner: new SharedSpinner(),
} as unknown as ImgProcContext;

export const mockOptions: ImgProcUserOptions = {};

export const mockDbOptions: ImgProcDataAdapterInitOptions = {
  rootDir: 'mock-root-dir',
  cacheDir: 'mock-cacheDir-dir',
  imageCacheDir: 'mock-imageCacheDir-dir',
  retentionPeriod: 1000 * 60 * 60 * 24 * 100,
  retentionCount: 10,
};

export const mockVariant: ImgProcFile = {
  category: 'variant',
  hash: 'mock-variant-hash',
  source: 'mock-variant-source',
  profile: 'mock-variant-profile',
  width: 1024,
  height: 768,
  r: 0,
  g: 128,
  b: 256,
  format: 'avif',
};

export const mockVariants: ImgProcVariants = {
  avif: [
    {
      hash: 'mockAvif2x',
      format: 'avif',
      ext: 'avif',
      width: 1024,
      height: 768,
      descriptor: '2x',
    },
    {
      hash: 'mockAvif1x',
      format: 'avif',
      ext: 'avif',
      width: 512,
      height: 384,
      descriptor: '1x',
    },
  ],
  webp: [
    {
      hash: 'mockWebp2x',
      format: 'webp',
      ext: 'webp',
      width: 1024,
      height: 768,
      descriptor: '2x',
    },
    {
      hash: 'mockWebp1x',
      format: 'webp',
      ext: 'webp',
      width: 512,
      height: 384,
      descriptor: '1x',
    },
  ],
};

export const mockSource1: ImgProcFile = {
  category: 'source',
  hash: 'mock-source-1-hash',
  width: 1024,
  height: 768,
  source: 'mock-source-1-source',
  r: 1,
  g: 2,
  b: 3,
  format: 'png',
};

export const mockSource2: ImgProcFile = {
  category: 'source',
  hash: 'mock-source-2-hash',
  width: 1024,
  height: 768,
  source: 'mock-source-2-source',
  format: 'png',
};

export const mockSource3: ImgProcFile = {
  category: 'source',
  hash: 'mock-source-3-hash',
  width: 1024,
  height: 768,
  source: 'mock-source-3-source',
  format: 'jpeg',
  expiresAt: Date.now() + 10000,
};

export const mockSource4: ImgProcFile = {
  category: 'source',
  hash: 'mock-source-4-hash',
  width: 1024,
  height: 768,
  source: 'mock-source-4-source',
  format: 'jpeg',
  expiresAt: Date.now() - 10000,
};

export const mockPlaceholder1: ImgProcFile = {
  category: 'placeholder',
  hash: 'mock-placeholder-1-hash',
  width: 20,
  height: 20,
  source: 'mock-placeholder-1-source',
  profile: 'mock-placeholder-1-profile',
  format: 'jpeg',
  base64: 'mock-placeholder-base64-1',
};

export const mockVariant1: ImgProcFile = {
  category: 'variant',
  hash: 'mock-variant-1-hash',
  width: 800,
  height: 600,
  source: 'mock-variant-1-source',
  profile: 'mock-variant-1-profile',
  format: 'avif',
};

export const mockVariant2: ImgProcFile = {
  category: 'variant',
  hash: 'mock-variant-2-hash',
  width: 800,
  height: 600,
  source: 'mock-variant-2-source',
  profile: 'mock-variant-2-profile',
  format: 'webp',
};
