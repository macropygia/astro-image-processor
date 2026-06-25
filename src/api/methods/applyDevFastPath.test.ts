import { describe, expect, test } from 'vitest';

import { applyDevFastPath } from './applyDevFastPath.js';
import type { VariantProbeResult } from './probeVariants.js';

describe('applyDevFastPath', () => {
  test('marks source finalized with probed variants', () => {
    const source = {
      componentType: 'img' as const,
      options: {
        src: 'test.png',
        format: 'webp' as const,
        width: 800,
        layout: 'constrained' as const,
      },
      data: { width: 1600, height: 1200 },
      resolved: { widths: [800], densities: [1] },
      prepared: false,
      finalized: false,
    };

    const probe = {
      allHit: true,
      hits: [
        {
          hash: 'variant-hash',
          width: 800,
          height: 600,
          format: 'webp' as const,
          ext: 'webp',
          descriptor: '800w',
        },
      ],
      misses: [],
      variants: {
        webp: [
          {
            hash: 'variant-hash',
            width: 800,
            height: 600,
            format: 'webp' as const,
            ext: 'webp',
            descriptor: '800w',
          },
        ],
      },
    } satisfies VariantProbeResult;

    applyDevFastPath(source as never, probe);

    expect(source.prepared).toBe(true);
    expect(source.finalized).toBe(true);
    expect(source.variants?.webp).toHaveLength(1);
    expect(source.resolved.width).toBe(800);
    expect(source.resolved.sizes).toBeDefined();
  });
});
