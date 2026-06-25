import type { AstroIntegrationLogger } from 'astro';
import type { Sharp } from 'sharp';

import type { BaseSource } from '../BaseSource.js';
import { variantInflightKey } from '../utils/variantInflight.js';
import { noteVariantCompleted, noteVariantQueued } from '../utils/variantSpinnerProgress.js';
import { insertVariantRecord, runVariantCompressionJob } from './generateVariant.js';
import type { VariantProfileDescriptor } from './listVariantDescriptors.js';
import { serializeSourceProfiles } from './serializeSourceProfiles.js';

export type EnqueueVariantCompressionMissArgs = {
  source: BaseSource;
  sourceHash: string;
  descriptor: VariantProfileDescriptor;
  src: string;
  imageCacheDir: string;
  processor: Sharp | Sharp[] | undefined;
  hasher: BaseSource['settings']['hasher'];
  logger?: AstroIntegrationLogger | undefined;
};

const variantEnqueueByKey = new Map<string, Promise<void>>();

export const clearVariantCompressionEnqueueStateForTests = () => {
  variantEnqueueByKey.clear();
};

/** Dev slow path: enqueue variant compression with global dedupe. */
export const enqueueVariantCompressionMiss = ({
  source,
  sourceHash,
  descriptor,
  imageCacheDir,
  processor,
}: EnqueueVariantCompressionMissArgs): Promise<void> => {
  const { variantProfileHash, variantFormat, variantFormatOptions, variantWidth } = descriptor;

  const key = variantInflightKey(sourceHash, variantProfileHash);
  const existing = variantEnqueueByKey.get(key);
  if (existing) {
    return existing;
  }

  const variantKey = key;
  const task = (async () => {
    noteVariantQueued(variantKey, source.spinner);
    try {
      const buffer = await source.getBuffer();
      serializeSourceProfiles(processor);

      const result = await runVariantCompressionJob({
        buffer,
        imageCacheDir,
        processor,
        variantWidth,
        variantFormat,
        variantFormatOptions,
        compressionPool: source.compressionPool,
      });

      await insertVariantRecord({
        db: source.db,
        result,
        sourceHash,
        variantProfileHash,
      });
    } finally {
      noteVariantCompleted(variantKey, source.spinner);
    }
  })();

  variantEnqueueByKey.set(key, task);
  void task
    .finally(() => {
      if (variantEnqueueByKey.get(key) === task) {
        variantEnqueueByKey.delete(key);
      }
    })
    .catch(() => undefined);

  return task;
};
