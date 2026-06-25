import { trackDevCompression } from '../../integration/utils/devCompressionIdle.js';
import { getTimeStat } from '../../integration/utils/getTimeStat.js';
import type { BaseSource } from '../BaseSource.js';
import { enqueueVariantCompressionMiss } from './enqueueVariantCompression.js';
import { ensureDevSourceIdentity } from './ensureDevSourceIdentity.js';
import { enqueueBlurPlaceholderMiss } from './generateBlurredImage.js';
import type { BlurPlaceholderPeekResult } from './peekBlurPlaceholder.js';
import type { VariantProbeResult } from './probeVariants.js';
import type { DevPictureArtDirectiveProbe } from './runDevCacheProbe.js';

type EnqueueDevCompressionMissesArgs = {
  source: BaseSource;
  probe: VariantProbeResult;
  blurPeek: BlurPlaceholderPeekResult;
  artDirectiveProbes?: DevPictureArtDirectiveProbe[] | undefined;
};

const completeSpinner = (source: BaseSource, tasks: Promise<unknown>[]) => {
  if (tasks.length === 0) {
    source.spinner.succeed(`Completed in ${getTimeStat(source.timeStart, performance.now())}`);
    return;
  }

  void Promise.all(tasks)
    .then(() => {
      source.spinner.succeed(`Completed in ${getTimeStat(source.timeStart, performance.now())}`);
    })
    .catch(() => {
      source.spinner.fail('Failed');
    });
};

const enqueueSourceCompressionWork = async (
  source: BaseSource,
  probe: VariantProbeResult,
  extraTasks: Array<() => Promise<unknown>> = [],
): Promise<void> => {
  await ensureDevSourceIdentity(source);
  source.ensureDevSpinner();

  const {
    data: { hash: sourceHash },
    options: { src, processor },
    dirs: { imageCacheDir },
    settings: { hasher },
    logger,
  } = source;

  if (!sourceHash) {
    throw new Error('Source hash does not exist');
  }

  const tasks: Promise<unknown>[] = [];

  for (const descriptor of probe.misses) {
    const task = enqueueVariantCompressionMiss({
      source,
      sourceHash,
      descriptor,
      src,
      imageCacheDir,
      processor,
      hasher,
      logger,
    });
    tasks.push(task);
    trackDevCompression(task);
  }

  for (const createTask of extraTasks) {
    const task = createTask();
    tasks.push(task);
    trackDevCompression(task);
  }

  completeSpinner(source, tasks);
};

const runEnqueueDevCompressionMisses = async ({
  source,
  probe,
  blurPeek,
  artDirectiveProbes,
}: EnqueueDevCompressionMissesArgs): Promise<void> => {
  const blurExtras =
    source.options.placeholder === 'blurred' && !blurPeek.hit
      ? [() => enqueueBlurPlaceholderMiss({ source })]
      : [];

  await enqueueSourceCompressionWork(source, probe, blurExtras);

  if (artDirectiveProbes?.length) {
    for (const { source: adSource, probe: adProbe } of artDirectiveProbes) {
      await enqueueSourceCompressionWork(adSource, adProbe);
    }
  }
};

/** Dev slow path: enqueue cache misses into the global Piscina queue (fire-and-forget). */
export const enqueueDevCompressionMisses = ({
  source,
  probe,
  blurPeek,
  artDirectiveProbes,
}: EnqueueDevCompressionMissesArgs): void => {
  void runEnqueueDevCompressionMisses({
    source,
    probe,
    blurPeek,
    artDirectiveProbes,
  }).catch((error) => {
    source.logger?.error(String(error));
    source.spinner.fail('Failed');
  });
};
