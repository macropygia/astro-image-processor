import { transparentPixelSrc } from '../../const.js';
import type { BaseSource } from '../BaseSource.js';

export type DevPlaceholderMode = 'empty' | 'source';

/** Provisional img `src` in development before variants exist. */
export const resolveProvisionalImageSrc = (source: BaseSource): string => {
  const {
    options: { devPlaceholder, src },
  } = source;

  if (import.meta.env.MODE !== 'development' || devPlaceholder !== 'source') {
    return transparentPixelSrc;
  }

  return src;
};
