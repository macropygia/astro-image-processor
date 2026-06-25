import type { ImgProcOutputFormat, ImgProcVariant, ImgProcVariants } from '../../types.js';
import type { BaseSource } from '../BaseSource.js';

export const groupVariantHits = (source: BaseSource, hits: ImgProcVariant[]): ImgProcVariants => {
  const {
    componentType,
    options: { format, formats },
  } = source;

  const formatsArray = (componentType === 'img' ? [format] : formats) as ImgProcOutputFormat[];
  const variants: ImgProcVariants = {};

  for (const variantFormat of formatsArray) {
    variants[variantFormat] = [];
  }

  for (const hit of hits) {
    variants[hit.format]?.push(hit);
  }

  for (const variantFormat of formatsArray) {
    variants[variantFormat]?.sort((a, b) => a.width - b.width);
  }

  return variants;
};
