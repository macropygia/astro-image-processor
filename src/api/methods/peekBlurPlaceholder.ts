import type { BaseSource } from '../BaseSource.js';
import { deterministicHash } from '../utils/deterministicHash.js';
import { getFilteredSharpOptions } from '../utils/getFilteredSharpOptions.js';
import { resolveProbeSourceHash } from './resolveProbeSourceHash.js';

export type BlurPlaceholderPeekResult = {
  hit: boolean;
  hash?: string;
  base64?: string;
  format?: string;
  width?: number;
  height?: number;
  dataUrl?: string;
};

/** Read-only blur placeholder DB peek (no db.renew / insert). */
export const peekBlurPlaceholder = async (
  source: BaseSource,
): Promise<BlurPlaceholderPeekResult> => {
  if (source.options.placeholder !== 'blurred') {
    return { hit: false };
  }

  const {
    db,
    options: { blurProcessor },
    settings: { hasher },
  } = source;

  const sourceHash = await resolveProbeSourceHash(source);
  const sourceProfile = source.profile;
  const profile = deterministicHash(
    [sourceProfile, getFilteredSharpOptions(blurProcessor)].flat().filter(Boolean),
    hasher,
  );

  const data = await db.fetch({ source: sourceHash, profile });
  if (!data?.base64 || !data.format) {
    return { hit: false };
  }

  return {
    hit: true,
    hash: data.hash,
    base64: data.base64,
    format: data.format,
    width: data.width,
    height: data.height,
    dataUrl: `data:image/${data.format};base64,${data.base64}`,
  };
};
