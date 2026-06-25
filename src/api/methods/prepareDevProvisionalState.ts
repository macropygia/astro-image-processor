import sharp from 'sharp';

import type { BaseSource } from '../BaseSource.js';
import { resolveProvisionalElementDimensions } from './resolveProvisionalElementDimensions.js';
import { resolveProvisionalSizes } from './resolveProvisionalSizes.js';
import { resolveWidths } from './resolveWidths.js';

const assignDimensionsFromProps = (source: BaseSource) => {
  const {
    options: { width, height },
    data,
  } = source;

  if (width && height) {
    data.width = width;
    data.height = height;
    return true;
  }

  if (width) {
    data.width = width;
    data.height = width;
    return true;
  }

  if (height) {
    data.width = height;
    data.height = height;
    return true;
  }

  return false;
};

/** Read image dimensions without loading the full source buffer (dev placeholder path). */
export const ensureDevProvisionalMetadata = async (source: BaseSource) => {
  const { data, type, localSourcePath } = source;

  if (data.width && data.height) {
    return;
  }

  if (type === 'local') {
    const metadata = await sharp(localSourcePath).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Invalid source dimensions: ${source.options.src}`);
    }
    Object.assign(data, { width: metadata.width, height: metadata.height });
    return;
  }

  if (assignDimensionsFromProps(source)) {
    return;
  }

  throw new Error(`Cannot resolve provisional dimensions for ${source.options.src}`);
};

export const resolveProvisionalLayout = (source: BaseSource) => {
  resolveProvisionalElementDimensions(source);
  source.resolved.sizes = resolveProvisionalSizes(source);
};

export const prepareDevProvisionalState = async (source: BaseSource) => {
  await ensureDevProvisionalMetadata(source);
  resolveWidths(source);
  resolveProvisionalLayout(source);
};
