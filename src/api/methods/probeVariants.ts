import type { ImgProcVariant, ImgProcVariants } from '../../types.js';
import type { BaseSource } from '../BaseSource.js';
import { groupVariantHits } from './groupVariantHits.js';
import type { VariantProfileDescriptor } from './listVariantDescriptors.js';
import { listVariantDescriptors } from './listVariantDescriptors.js';
import { peekVariant } from './peekVariant.js';
import { resolveProbeSourceHash } from './resolveProbeSourceHash.js';

export type VariantProbeResult = {
  allHit: boolean;
  hits: ImgProcVariant[];
  misses: VariantProfileDescriptor[];
  variants?: ImgProcVariants;
};

type ProbeVariants = (source: BaseSource) => Promise<VariantProbeResult>;

export const probeVariants: ProbeVariants = async (source) => {
  const {
    db,
    dirs: { imageCacheDir },
  } = source;

  const sourceHash = await resolveProbeSourceHash(source);
  const descriptors = listVariantDescriptors(source);
  const hits: ImgProcVariant[] = [];
  const misses: VariantProfileDescriptor[] = [];

  for (const descriptor of descriptors) {
    const variant = await peekVariant({
      db,
      sourceHash,
      variantProfileHash: descriptor.variantProfileHash,
      imageCacheDir,
      variantWidth: descriptor.variantWidth,
      variantDensity: descriptor.variantDensity,
    });

    if (variant) {
      hits.push(variant);
    } else {
      misses.push(descriptor);
    }
  }

  const allHit = misses.length === 0;

  return {
    allHit,
    hits,
    misses,
    ...(allHit ? { variants: groupVariantHits(source, hits) } : {}),
  };
};
