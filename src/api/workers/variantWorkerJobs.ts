import type { ImgProcOutputFormat } from '../../types.js';

export type VariantWorkerVariantJob = {
  variantWidth: number;
  format: ImgProcOutputFormat;
  formatOptions: Record<string, unknown>;
};

export type VariantWorkerBlurJob = {
  resizeWidth: number;
  format: ImgProcOutputFormat;
  formatOptions: Record<string, unknown>;
};

const formatOptionKeys: Record<ImgProcOutputFormat, string[]> = {
  avif: ['quality', 'lossless', 'effort', 'chromaSubsampling', 'bitdepth'],
  gif: [
    'reuse',
    'progressive',
    'colours',
    'effort',
    'dither',
    'interFrameMaxError',
    'interPaletteMaxError',
  ],
  jpeg: [
    'quality',
    'progressive',
    'chromaSubsampling',
    'optimizeCoding',
    'mozjpeg',
    'trellisQuantisation',
    'overshootDeringing',
    'optimizeScans',
    'quantisationTable',
  ],
  png: [
    'progressive',
    'compressionLevel',
    'adaptiveFiltering',
    'palette',
    'quality',
    'effort',
    'colours',
    'dither',
  ],
  webp: [
    'quality',
    'alphaQuality',
    'lossless',
    'nearLossless',
    'smartSubsample',
    'preset',
    'effort',
    'loop',
    'delay',
  ],
};

const sharpOptionKeyByFormat: Partial<Record<ImgProcOutputFormat, Record<string, string>>> = {
  webp: { quality: 'webpQuality' },
  jpeg: { quality: 'jpegQuality' },
  avif: { quality: 'avifQuality' },
  png: { compressionLevel: 'pngCompressionLevel' },
};

export const formatOptionsFromSharpState = (
  format: ImgProcOutputFormat,
  options: Record<string, unknown>,
): Record<string, unknown> => {
  const allowedKeys = formatOptionKeys[format] ?? [];
  const sharpKeys = sharpOptionKeyByFormat[format] ?? {};
  const result: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    const sharpKey = sharpKeys[key] ?? key;
    const value = options[sharpKey];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'number' && value < 0) {
      continue;
    }
    result[key] = value;
  }

  return result;
};
