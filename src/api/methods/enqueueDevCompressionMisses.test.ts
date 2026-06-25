import { beforeEach, describe, expect, test, vi } from 'vitest';

import { enqueueDevCompressionMisses } from './enqueueDevCompressionMisses.js';
import type { VariantProbeResult } from './probeVariants.js';

vi.mock('./ensureDevSourceIdentity.js', () => ({
  ensureDevSourceIdentity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./enqueueVariantCompression.js', () => ({
  enqueueVariantCompressionMiss: vi.fn(),
}));

vi.mock('./generateBlurredImage.js', () => ({
  enqueueBlurPlaceholderMiss: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../integration/utils/devCompressionIdle.js', () => ({
  trackDevCompression: vi.fn((promise: Promise<unknown>) => promise),
}));

import { trackDevCompression } from '../../integration/utils/devCompressionIdle.js';
import { enqueueVariantCompressionMiss } from './enqueueVariantCompression.js';
import { ensureDevSourceIdentity } from './ensureDevSourceIdentity.js';
import { enqueueBlurPlaceholderMiss } from './generateBlurredImage.js';

const drainEnqueue = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

const missProbe = {
  allHit: false,
  hits: [],
  misses: [
    {
      variantProfileHash: 'profile-a',
      variantFormat: 'webp' as const,
      variantWidth: 800,
    },
    {
      variantProfileHash: 'profile-b',
      variantFormat: 'webp' as const,
      variantWidth: 400,
    },
  ],
  variants: { webp: [] },
} satisfies VariantProbeResult;

const hitProbe = {
  allHit: true,
  hits: [],
  misses: [],
  variants: { webp: [] },
} satisfies VariantProbeResult;

const createSource = (overrides: Record<string, unknown> = {}) =>
  ({
    data: { hash: 'source-hash' },
    options: {
      src: 'test.png',
      processor: undefined,
      placeholder: 'empty',
    },
    dirs: { imageCacheDir: 'cache/' },
    settings: { hasher: vi.fn() },
    logger: undefined,
    timeStart: performance.now(),
    ensureDevSpinner: vi.fn(),
    spinner: {
      resetVariantProgress: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    },
    ...overrides,
  }) as never;

describe('enqueueDevCompressionMisses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enqueueVariantCompressionMiss).mockResolvedValue(undefined);
  });

  test('enqueues variant compression for each probe miss without waiting on gates', async () => {
    const source = createSource();

    enqueueDevCompressionMisses({
      source,
      probe: missProbe,
      blurPeek: { hit: false },
    });
    await drainEnqueue();

    expect(ensureDevSourceIdentity).toHaveBeenCalledWith(source);
    expect(enqueueVariantCompressionMiss).toHaveBeenCalledTimes(2);
    expect(trackDevCompression).toHaveBeenCalledTimes(2);
    expect(enqueueBlurPlaceholderMiss).not.toHaveBeenCalled();
  });

  test('does not enqueue when probe has no misses', async () => {
    const source = createSource();

    enqueueDevCompressionMisses({
      source,
      probe: hitProbe,
      blurPeek: { hit: true },
    });
    await drainEnqueue();

    expect(enqueueVariantCompressionMiss).not.toHaveBeenCalled();
    expect(trackDevCompression).not.toHaveBeenCalled();
  });

  test('enqueues blur placeholder when blurred placeholder misses', async () => {
    const source = createSource({
      options: {
        src: 'test.png',
        processor: undefined,
        placeholder: 'blurred',
      },
    });

    enqueueDevCompressionMisses({
      source,
      probe: missProbe,
      blurPeek: { hit: false },
    });
    await drainEnqueue();

    expect(enqueueBlurPlaceholderMiss).toHaveBeenCalledWith({ source });
    expect(trackDevCompression).toHaveBeenCalledTimes(3);
  });

  test('enqueues art directive sources', async () => {
    const source = createSource();
    const adSource = createSource({ data: { hash: 'ad-hash' } });
    const adProbe = {
      ...missProbe,
      misses: [
        {
          variantProfileHash: 'ad-profile',
          variantFormat: 'webp' as const,
          variantWidth: 640,
        },
      ],
    } satisfies VariantProbeResult;

    enqueueDevCompressionMisses({
      source,
      probe: missProbe,
      blurPeek: { hit: true },
      artDirectiveProbes: [{ source: adSource, probe: adProbe }],
    });
    await drainEnqueue();

    expect(ensureDevSourceIdentity).toHaveBeenCalledWith(adSource);
    expect(enqueueVariantCompressionMiss).toHaveBeenCalledTimes(3);
  });
});
