import type { BaseSource } from '../BaseSource.js';
import { addSource } from './addSource.js';
import { generateSourceHash } from './generateSourceHash.js';
import { renewSource } from './renewSource.js';

/** Ensure source hash exists in DB without enqueueing variant generation (dev slow path). */
export const ensureDevSourceIdentity = async (
  source: BaseSource,
  signal?: AbortSignal,
): Promise<void> => {
  if (signal?.aborted) {
    return;
  }

  const { data } = source;

  if (!data.hash) {
    data.hash = await generateSourceHash(source);
  }

  if (signal?.aborted) {
    return;
  }

  const currentData = await source.db.fetch({ hash: data.hash });
  if (currentData) {
    Object.assign(data, currentData);
    await renewSource(source);
  } else {
    await addSource(source);
  }
};
