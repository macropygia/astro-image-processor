import type { BaseSource } from '../BaseSource.js';

type ResolveProvisionalElementDimensions = (source: BaseSource) => void;

/**
 * Resolve element width and height from source metadata before variants exist.
 */
export const resolveProvisionalElementDimensions: ResolveProvisionalElementDimensions = (
  source,
) => {
  const {
    data,
    options: { src, width, height },
    resolved,
  } = source;

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!data.width || !data.height) {
    throw new Error(`Invalid source demiensions: ${src}`);
  }

  const sourceWidth = data.width;
  const sourceHeight = data.height;

  let elementWidth: number;
  let elementHeight: number;

  if (width && height) {
    elementWidth = width;
    elementHeight = height;
  } else if (width && !height) {
    elementWidth = width;
    elementHeight = Math.round(width * (sourceHeight / sourceWidth));
  } else if (!width && height) {
    elementWidth = Math.round(height * (sourceWidth / sourceHeight));
    elementHeight = height;
  } else {
    elementWidth = sourceWidth;
    elementHeight = sourceHeight;
  }

  resolved.width = elementWidth;
  resolved.height = elementHeight;
};
