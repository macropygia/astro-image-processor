import type { BaseSource } from '../BaseSource.js';
import type { VariantProbeResult } from './probeVariants.js';
import { resolveElementDimensions } from './resolveElementDimensions.js';
import { resolveSizes } from './resolveSizes.js';

/** Apply a successful cache probe as finalized source state (fast path). */
export const applyDevFastPath = (source: BaseSource, probe: VariantProbeResult): void => {
  if (!probe.allHit || !probe.variants) {
    throw new Error('Cannot apply fast path without a full cache hit');
  }

  source.variants = probe.variants;
  resolveElementDimensions(source);
  source.resolved.sizes = resolveSizes(source);
  source.prepared = true;
  source.finalized = true;
};
