// src/api/workers/compressionWorker.ts
import crypto from 'node:crypto';
import fs from 'node:fs';
import path2 from 'node:path';
// src/api/utils/normalizePath.ts
import path from 'node:path';

import sharp2 from 'sharp';
var LAST_SLASH_RE = /\/+$/;
var normalizePath = (pathLike, trailingSlash) => {
  let newPath = pathLike.replaceAll('\\', '/');
  if (trailingSlash === true) {
    newPath = `${newPath}/`;
  } else if (trailingSlash === false) {
    newPath.replace(LAST_SLASH_RE, '');
  }
  return path.posix.normalize(newPath);
};

// src/api/utils/resolveSharpFormat.ts
function resolveSharpFormat(sharpFormat, compression) {
  if (sharpFormat === 'heif' && compression === 'av1') {
    return 'avif';
  }
  if (sharpFormat === 'heif' && compression === 'hevc') {
    return 'heic';
  }
  if (sharpFormat === 'svg') {
    throw new Error('SVG is not supported');
  }
  return sharpFormat;
}

// src/api/workers/applySharpProfiles.ts
import sharp from 'sharp';
var applySharpProfiles = async (buffer, profiles) => {
  if (profiles.length === 0) {
    return buffer;
  }
  let pipeline = sharp(buffer);
  for (const profile of profiles) {
    pipeline = pipeline.pipe(sharp(profile));
  }
  return pipeline.toBuffer();
};

// src/api/workers/compressionWorker.ts
var extByFormat = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
};
var isOutputFormat = (format) => format in extByFormat;
var hashBuffer = (buffer) => crypto.hash('md5', buffer);
var resolveWorkerOutputFormat = (metadata) => {
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
var runVariantJob = async (job) => {
  const prepared = await applySharpProfiles(job.buffer, job.sourceProfiles);
  const variantBuffer = await sharp2(prepared)
    .resize(job.variantWidth)
    .toFormat(job.variantFormat, job.variantFormatOptions)
    .toBuffer();
  const metadata = await sharp2(variantBuffer).metadata();
  const format = resolveWorkerOutputFormat(metadata);
  const hash = hashBuffer(variantBuffer);
  const ext = extByFormat[format];
  const imageCachePath = normalizePath(path2.join(job.imageCacheDir, `${hash}.${ext}`));
  await fs.promises.writeFile(imageCachePath, variantBuffer);
  return {
    hash,
    width: metadata.width ?? job.variantWidth,
    height: metadata.height ?? metadata.width ?? job.variantWidth,
    format,
    ext,
  };
};
var runBlurJob = async (job) => {
  const prepared = await applySharpProfiles(job.buffer, job.sourceProfiles);
  const blurredBuffer = await sharp2(prepared)
    .resize(job.resizeWidth)
    .toFormat(job.format, job.formatOptions)
    .toBuffer();
  const metadata = await sharp2(blurredBuffer).metadata();
  const format = resolveWorkerOutputFormat(metadata);
  return {
    hash: hashBuffer(blurredBuffer),
    base64: blurredBuffer.toString('base64'),
    format,
    width: metadata.width ?? job.resizeWidth,
    height: metadata.height ?? job.resizeWidth,
  };
};
async function runCompressionJob(job) {
  return job.type === 'blur' ? runBlurJob(job) : runVariantJob(job);
}
export { runCompressionJob as default };
