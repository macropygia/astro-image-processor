import type { AstroIntegrationLogger } from 'astro';

import { clearPrepareDedupeState } from '../../api/methods/prepareSourceDeduped.js';
import { clearVariantGenerationResolutions } from '../../api/methods/resolveVariantGeneration.js';
import { clearInflightVariants } from '../../api/utils/variantInflight.js';
import { clearVariantSpinnerProgress } from '../../api/utils/variantSpinnerProgress.js';
import type { ImgProcContext } from '../../types.js';

export const DEV_RELOAD_DRAIN_TIMEOUT_MS = 30_000;

type AwaitProcessorContextReload = (args: {
  previous: ImgProcContext;
  logger?: AstroIntegrationLogger;
  timeoutMs?: number;
}) => Promise<void>;

/**
 * Dev-only: wait for the previous context's compression pool before replacing global context
 * on astro.config reload, then clear module-level in-flight deduplication.
 */
export const awaitProcessorContextReload: AwaitProcessorContextReload = async ({
  previous,
  logger,
  timeoutMs = DEV_RELOAD_DRAIN_TIMEOUT_MS,
}) => {
  const { compressionPool } = previous;

  const cleanup = async () => {
    clearInflightVariants();
    clearVariantGenerationResolutions();
    clearPrepareDedupeState();
    clearVariantSpinnerProgress();
    if (compressionPool) {
      await compressionPool.destroy();
    }
  };

  if (!compressionPool || compressionPool.pending === 0) {
    await cleanup();
    return;
  }

  logger?.info('Waiting for in-flight image processing before config reload...');

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('compression pool drain timeout'));
    }, timeoutMs);
  });

  try {
    await Promise.race([compressionPool.onIdle(), timeout]);
    logger?.info('In-flight image processing completed.');
  } catch {
    logger?.warn(
      `Timed out after ${timeoutMs}ms waiting for compression pool; proceeding with config reload.`,
    );
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }

  await cleanup();
};
