import path from 'node:path';

import { extByFormat } from '../../const.js';
import type { ImgProcDataAdapter, ImgProcVariant } from '../../types.js';
import { pathExists } from '../utils/pathExists.js';
import { isOutputFormat } from '../utils/typeGuards.js';

type PeekVariant = (args: {
  db: ImgProcDataAdapter;
  sourceHash: string;
  variantProfileHash: string;
  imageCacheDir: string;
  variantWidth: number;
  variantDensity?: number | undefined;
}) => Promise<ImgProcVariant | null>;

/** Read-only variant cache lookup (no db.renew / db.delete). */
export const peekVariant: PeekVariant = async ({
  db,
  sourceHash,
  variantProfileHash,
  imageCacheDir,
  variantWidth,
  variantDensity,
}) => {
  const variantData = await db.fetch({
    source: sourceHash,
    profile: variantProfileHash,
  });

  if (!variantData) {
    return null;
  }

  const { hash, format, width, height } = variantData;
  if (!isOutputFormat(format)) {
    throw new Error('Invalid output format');
  }

  const ext = extByFormat[format];
  const imageCachePath = path.join(imageCacheDir, `${hash}.${ext}`);

  if ((await pathExists(imageCachePath)) && width === variantWidth) {
    return {
      hash,
      width,
      height,
      format,
      ext,
      descriptor: variantDensity ? `${variantDensity}x` : `${variantWidth}w`,
    };
  }

  return null;
};
