import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import type { ImgProcVariant } from '../../types.js';
import { resetInflightVariantsForTests } from '../utils/variantInflight.js';
import { generateVariant } from './generateVariant.js';
import {
  clearVariantGenerationResolutions,
  resolveVariantGeneration,
} from './resolveVariantGeneration.js';
import { retrieveVariant } from './retrieveVariant.js';

vi.mock('./retrieveVariant.js', () => ({
  retrieveVariant: vi.fn(),
}));

vi.mock('./generateVariant.js', () => ({
  generateVariant: vi.fn(),
}));

describe('resolveVariantGeneration', () => {
  const sourceMock: any = {
    db: {},
    spinner: {
      text: '',
      setVariantProgress: vi.fn(),
      noteVariantQueued: vi.fn(),
      noteVariantCompleted: vi.fn(),
      resetVariantProgress: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
      cancel: vi.fn(),
    },
    compressionPool: {},
    getBuffer: vi.fn(),
    settings: { hasher: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetInflightVariantsForTests();
    clearVariantGenerationResolutions();
    (retrieveVariant as Mock).mockResolvedValue(null);
    sourceMock.getBuffer.mockResolvedValue(Buffer.from('buffer'));
  });

  test('shares one retrieveVariant lookup across concurrent callers', async () => {
    let releaseRetrieve: () => void = () => undefined;
    const retrieveGate = new Promise<void>((resolve) => {
      releaseRetrieve = resolve;
    });

    (retrieveVariant as Mock).mockImplementation(async () => {
      await retrieveGate;
      return null;
    });

    const generatedItem = {
      hash: 'generatedHash',
      width: 800,
      height: 600,
      format: 'webp' as const,
      ext: 'webp',
      descriptor: '800w',
    } satisfies ImgProcVariant;

    (generateVariant as Mock).mockResolvedValue(generatedItem);

    const args = {
      source: sourceMock,
      sourceHash: 'source-hash',
      variantProfileHash: 'profile-hash',
      src: 'test.png',
      variantFormat: 'webp' as const,
      variantWidth: 800,
      imageCacheDir: 'cache/',
      processor: undefined,
      hasher: vi.fn(),
    };

    const first = resolveVariantGeneration(args);
    const second = resolveVariantGeneration(args);

    await Promise.resolve();
    expect(retrieveVariant).toHaveBeenCalledTimes(1);

    releaseRetrieve();
    await expect(first).resolves.toEqual(generatedItem);
    await expect(second).resolves.toEqual(generatedItem);
    expect(generateVariant).toHaveBeenCalledTimes(1);
  });
});
