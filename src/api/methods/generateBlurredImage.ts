import type { BaseSource } from '../BaseSource.js';
import { getFilteredSharpOptions } from '../utils/getFilteredSharpOptions.js';
import { isOutputFormat } from '../utils/typeGuards.js';
import {
  formatOptionsFromSharpState,
  type VariantWorkerBlurJob,
} from '../workers/variantWorkerJobs.js';
import { resolveBlurPlaceholderProfile } from './resolveBlurPlaceholderProfile.js';
import { serializeSourceProfiles } from './serializeSourceProfiles.js';

type GenerateBlurredImage = (source: BaseSource) => Promise<string>;

const blurEnqueueByKey = new Map<string, Promise<void>>();

export const clearBlurPlaceholderEnqueueStateForTests = () => {
  blurEnqueueByKey.clear();
};

const blurJobFromProcessor = (
  blurProcessor: BaseSource['options']['blurProcessor'],
): VariantWorkerBlurJob => {
  const options = getFilteredSharpOptions(blurProcessor);
  const format = options.formatOut;
  if (typeof format !== 'string' || !isOutputFormat(format)) {
    throw new Error('Invalid blur processor output format');
  }

  return {
    resizeWidth: Math.max(1, Number(options.width) || 1),
    format,
    formatOptions: formatOptionsFromSharpState(format, options),
  };
};

type EnqueueBlurPlaceholderMissArgs = {
  source: BaseSource;
};

/** Dev slow path: enqueue blur placeholder generation with global dedupe. */
export const enqueueBlurPlaceholderMiss = ({
  source,
}: EnqueueBlurPlaceholderMissArgs): Promise<void> => {
  const {
    db,
    data: { hash: sourceHash },
    options: { processor: sourceProcessor, blurProcessor },
    compressionPool,
  } = source;

  if (!sourceHash) {
    throw new Error('Source hash does not exist');
  }

  const profile = resolveBlurPlaceholderProfile(source);
  const key = `${sourceHash}\0${profile}`;
  const existing = blurEnqueueByKey.get(key);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    const data = await db.fetch({ source: sourceHash, profile });
    if (data?.base64) {
      await db.renew({ source: sourceHash, profile });
      return;
    }

    const buffer = await source.getBuffer();
    const blurJob = blurJobFromProcessor(blurProcessor);
    const result = await compressionPool.runBlur({
      buffer,
      sourceProfiles: serializeSourceProfiles(sourceProcessor),
      resizeWidth: blurJob.resizeWidth,
      format: blurJob.format,
      formatOptions: blurJob.formatOptions,
    });

    await db.insert({
      hash: result.hash,
      base64: result.base64,
      category: 'placeholder',
      format: result.format,
      width: result.width,
      height: result.height,
      source: sourceHash,
      profile,
    });
  })();

  blurEnqueueByKey.set(key, task);
  void task.finally(() => {
    if (blurEnqueueByKey.get(key) === task) {
      blurEnqueueByKey.delete(key);
    }
  });

  return task;
};

/**
 * Generate blurred image
 * - If exists on the database, return it.
 */
export const generateBlurredImage: GenerateBlurredImage = async (source) => {
  const {
    db,
    data: { hash: sourceHash },
    options: { processor: sourceProcessor, blurProcessor },
    compressionPool,
  } = source;

  if (!sourceHash) {
    throw new Error('Source hash does not exist');
  }

  const profile = resolveBlurPlaceholderProfile(source);

  const data = await db.fetch({ source: sourceHash, profile });
  if (data?.base64) {
    await db.renew({ source: sourceHash, profile });
    return `data:image/${data.format};base64,${data.base64}`;
  }

  const buffer = await source.getBuffer();
  const blurJob = blurJobFromProcessor(blurProcessor);
  const result = await compressionPool.runBlur({
    buffer,
    sourceProfiles: serializeSourceProfiles(sourceProcessor),
    resizeWidth: blurJob.resizeWidth,
    format: blurJob.format,
    formatOptions: blurJob.formatOptions,
  });

  await db.insert({
    hash: result.hash,
    base64: result.base64,
    category: 'placeholder',
    format: result.format,
    width: result.width,
    height: result.height,
    source: sourceHash,
    profile,
  });

  return `data:image/${result.format};base64,${result.base64}`;
};
