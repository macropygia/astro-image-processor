import { beforeEach, describe, expect, test, vi } from 'vitest';

import { cryptoHasher } from '../../extras/cryptoHasher.js';
import { listVariantDescriptors } from './listVariantDescriptors.js';
import { peekVariant } from './peekVariant.js';
import { probeVariants } from './probeVariants.js';

vi.mock('./peekVariant.js', () => ({
  peekVariant: vi.fn(),
}));

describe('probeVariants', () => {
  const createSource = () => ({
    componentType: 'img' as const,
    options: { format: 'webp' as const, densities: [1] as [number, ...number[]] },
    formatOptions: { webp: {} },
    resolved: { widths: [20] as [number, ...number[]], densities: [1] as [number, ...number[]] },
    profile: 'source-profile',
    settings: { hasher: cryptoHasher },
    data: { hash: 'source-hash' },
    db: {
      fetch: vi.fn(),
      renew: vi.fn(),
      delete: vi.fn(),
    },
    dirs: { imageCacheDir: '/cache' },
  });

  beforeEach(() => {
    vi.mocked(peekVariant).mockReset();
  });

  test('reports allHit when every descriptor is cached', async () => {
    const source = createSource();
    expect(listVariantDescriptors(source as never)).toHaveLength(1);

    vi.mocked(peekVariant).mockResolvedValue({
      hash: 'variant-hash',
      width: 20,
      height: 10,
      format: 'webp',
      ext: 'webp',
      descriptor: '20w',
    });

    const result = await probeVariants(source as never);

    expect(result.allHit).toBe(true);
    expect(result.misses).toHaveLength(0);
    expect(result.variants?.webp).toHaveLength(1);
    expect(source.db.renew).not.toHaveBeenCalled();
    expect(source.db.delete).not.toHaveBeenCalled();
  });

  test('reports partial miss without side effects', async () => {
    const source = createSource();
    vi.mocked(peekVariant).mockResolvedValue(null);

    const result = await probeVariants(source as never);

    expect(result.allHit).toBe(false);
    expect(result.hits).toHaveLength(0);
    expect(result.misses).toHaveLength(1);
    expect(result.variants).toBeUndefined();
    expect(peekVariant).toHaveBeenCalledTimes(1);
    expect(source.db.renew).not.toHaveBeenCalled();
    expect(source.db.delete).not.toHaveBeenCalled();
  });
});
