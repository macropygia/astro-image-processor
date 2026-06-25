import type { Sharp } from 'sharp';

import { getFilteredSharpOptions } from '../utils/getFilteredSharpOptions.js';

export const serializeSourceProfiles = (
  processor: Sharp | Sharp[] | undefined,
): Record<string, unknown>[] => {
  if (!processor) {
    return [];
  }

  const processors = Array.isArray(processor) ? processor : [processor];
  return processors.map((item) => getFilteredSharpOptions(item));
};
