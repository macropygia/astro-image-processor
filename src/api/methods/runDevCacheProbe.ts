import type { ImgProcContext } from '../../types.js';
import type { ArtDirectiveSource } from '../ArtDirectiveSource.js';
import { ArtDirectiveSource as ArtDirectiveSourceClass } from '../ArtDirectiveSource.js';
import type { PictureSource } from '../PictureSource.js';
import { applyDevFastPath } from './applyDevFastPath.js';
import { ensureDevDominantColorMetadata } from './ensureDevDominantColorMetadata.js';
import { prepareDevProvisionalState } from './prepareDevProvisionalState.js';
import type { VariantProbeResult } from './probeVariants.js';
import { probeVariants } from './probeVariants.js';
import { resolveProbeSourceHash } from './resolveProbeSourceHash.js';

export type DevPictureArtDirectiveProbe = {
  source: ArtDirectiveSource;
  probe: VariantProbeResult;
};

export type DevPictureCacheProbeResult = {
  allHit: boolean;
  mainProbe: VariantProbeResult;
  artDirectives: DevPictureArtDirectiveProbe[];
};

export const runDevCacheProbe = async (source: Parameters<typeof probeVariants>[0]) => {
  await prepareDevProvisionalState(source);
  await resolveProbeSourceHash(source);
  await ensureDevDominantColorMetadata(source);
  return probeVariants(source);
};

export const runDevPictureCacheProbe = async (
  source: PictureSource,
): Promise<DevPictureCacheProbeResult> => {
  await prepareDevProvisionalState(source);
  await resolveProbeSourceHash(source);
  await ensureDevDominantColorMetadata(source);

  const mainProbe = await probeVariants(source);
  const { artDirectives, tagName } = source.options;
  const artDirectiveProbes: DevPictureArtDirectiveProbe[] = [];

  if (artDirectives?.length) {
    for (const artDirective of artDirectives) {
      const adSource = ArtDirectiveSourceClass.buildArtDirective({
        ctx: (source as PictureSource & { ctx: ImgProcContext }).ctx,
        componentType: source.componentType,
        componentHash: source.componentHash,
        options: { ...artDirective, ...(tagName ? { tagName } : undefined) },
        parentSizes: '',
      });

      await prepareDevProvisionalState(adSource);
      await resolveProbeSourceHash(adSource);

      const adProbe = await probeVariants(adSource);
      artDirectiveProbes.push({ source: adSource, probe: adProbe });
    }
  }

  const allHit = mainProbe.allHit && artDirectiveProbes.every((item) => item.probe.allHit);

  return { allHit, mainProbe, artDirectives: artDirectiveProbes };
};

export const applyDevPictureFastPath = (
  source: PictureSource,
  result: DevPictureCacheProbeResult,
): void => {
  if (!result.allHit) {
    throw new Error('Cannot apply picture fast path without a full cache hit');
  }

  applyDevFastPath(source, result.mainProbe);

  if (!result.artDirectives.length) {
    return;
  }

  const parentSizes = source.resolved.sizes || '';
  source.artDirectives = result.artDirectives.map(({ source: adSource, probe }) => {
    applyDevFastPath(adSource, probe);
    adSource.parentSizes = parentSizes;
    return adSource;
  });
};
