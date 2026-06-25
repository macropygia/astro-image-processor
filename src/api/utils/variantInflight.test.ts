import { describe, expect, test } from 'vitest';

import type { ImgProcVariant } from '../../types.js';
import {
  clearInflightVariants,
  getInflightVariant,
  getOrCreateInflightVariant,
  resetInflightVariantsForTests,
  trackInflightVariant,
  variantInflightKey,
} from './variantInflight.js';

describe('variantInflight', () => {
  test('tracks and clears inflight variants by source profile key', async () => {
    resetInflightVariantsForTests();

    const item = {
      hash: 'variant-hash',
      width: 800,
      height: 600,
      format: 'webp' as const,
      ext: 'webp',
      descriptor: '800w',
    } satisfies ImgProcVariant;

    const task = trackInflightVariant('source-hash', 'profile-hash', Promise.resolve(item));

    expect(variantInflightKey('source-hash', 'profile-hash')).toBe('source-hash\0profile-hash');
    expect(getInflightVariant('source-hash', 'profile-hash')).toBe(task);

    await task;
    expect(getInflightVariant('source-hash', 'profile-hash')).toBeUndefined();
  });

  test('clearInflightVariants removes tracked entries immediately', () => {
    resetInflightVariantsForTests();

    trackInflightVariant(
      'source-hash',
      'profile-hash',
      new Promise(() => {
        // Never settles — clearInflightVariants should still drop the entry.
      }),
    );

    clearInflightVariants();
    expect(getInflightVariant('source-hash', 'profile-hash')).toBeUndefined();
  });

  test('getOrCreateInflightVariant returns the same promise for concurrent callers', () => {
    resetInflightVariantsForTests();

    let createCount = 0;
    const first = getOrCreateInflightVariant('source-hash', 'profile-hash', () => {
      createCount++;
      return new Promise<ImgProcVariant>(() => undefined);
    });
    const second = getOrCreateInflightVariant('source-hash', 'profile-hash', () => {
      createCount++;
      return new Promise<ImgProcVariant>(() => undefined);
    });

    expect(first).toBe(second);
    expect(createCount).toBe(1);
  });
});
