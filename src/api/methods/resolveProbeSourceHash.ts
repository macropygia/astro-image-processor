import type { BaseSource } from '../BaseSource.js';
import { generateSourceHash } from './generateSourceHash.js';

/** Resolve source hash for cache probe without db.renew / addSource. */
export const resolveProbeSourceHash = async (source: BaseSource): Promise<string> => {
  if (source.data.hash) {
    return source.data.hash;
  }

  const hash = await generateSourceHash(source);
  const existing = await source.db.fetch({ hash });
  if (existing) {
    Object.assign(source.data, existing);
  } else {
    source.data.hash = hash;
  }

  return hash;
};
