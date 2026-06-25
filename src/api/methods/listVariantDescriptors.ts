import sharp from 'sharp';

import type { ImgProcOutputFormat } from '../../types.js';
import type { BaseSource } from '../BaseSource.js';
import { deterministicHash } from '../utils/deterministicHash.js';
import { getFilteredSharpOptions } from '../utils/getFilteredSharpOptions.js';

export type VariantProfileDescriptor = {
  variantProfileHash: string;
  variantFormat: ImgProcOutputFormat;
  variantFormatOptions?: Record<string, unknown> | undefined;
  variantWidth: number;
  variantDensity?: number | undefined;
};

/** Enumerate variant profiles required for a source (shared by probe and enqueue). */
export const listVariantDescriptors = (source: BaseSource): VariantProfileDescriptor[] => {
  const {
    componentType,
    options: { densities, format, formats },
    formatOptions,
    resolved,
    settings: { hasher },
    profile,
  } = source;

  if (!resolved.widths) {
    throw new Error('Widths unresolved');
  }

  const formatsArray = (componentType === 'img' ? [format] : formats) as ImgProcOutputFormat[];
  const descriptors: VariantProfileDescriptor[] = [];

  for (const variantFormat of formatsArray) {
    const variantFormatOption = formatOptions[variantFormat];

    for (let index = 0; index < resolved.widths.length; index++) {
      const variantWidth = Math.round(resolved.widths[index] as number);
      const variantDensity =
        densities && resolved.densities ? resolved.densities[index] : undefined;

      const variantProcessor = sharp()
        .resize(variantWidth)
        .toFormat(variantFormat, variantFormatOption);

      const variantProfile = [profile, getFilteredSharpOptions(variantProcessor)]
        .flat()
        .filter(Boolean);
      const variantProfileHash = deterministicHash(variantProfile, hasher);

      descriptors.push({
        variantProfileHash,
        variantFormat,
        variantFormatOptions: variantFormatOption as Record<string, unknown> | undefined,
        variantWidth,
        variantDensity,
      });
    }
  }

  return descriptors;
};
