import sharp from 'sharp';
import { describe, expect, test, vi } from 'vitest';

import { peekBlurPlaceholder } from './peekBlurPlaceholder.js';
import { resolveProbeSourceHash } from './resolveProbeSourceHash.js';

vi.mock('./resolveProbeSourceHash.js', () => ({
  resolveProbeSourceHash: vi.fn().mockResolvedValue('source-hash'),
}));

describe('peekBlurPlaceholder', () => {
  test('returns dataUrl on cache hit without db.renew', async () => {
    const renew = vi.fn();
    const insert = vi.fn();
    const fetch = vi.fn().mockResolvedValue({
      hash: 'blur-hash',
      base64: 'abc123',
      format: 'webp',
      width: 1,
      height: 1,
      source: 'source-hash',
      profile: 'blur-profile',
    });

    const source = {
      options: {
        placeholder: 'blurred' as const,
        blurProcessor: sharp().resize(1).webp({ quality: 1 }),
      },
      profile: 'source-profile',
      settings: { hasher: (value: unknown) => JSON.stringify(value) },
      db: { fetch, renew, insert },
    };

    const result = await peekBlurPlaceholder(source as never);

    expect(result.hit).toBe(true);
    expect(result.dataUrl).toBe('data:image/webp;base64,abc123');
    expect(renew).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(resolveProbeSourceHash).toHaveBeenCalledWith(source);
  });

  test('returns miss when placeholder is not blurred', async () => {
    const fetch = vi.fn();
    const source = {
      options: {
        placeholder: 'dominantColor' as const,
        blurProcessor: sharp().resize(1).webp({ quality: 1 }),
      },
      db: { fetch },
    };

    const result = await peekBlurPlaceholder(source as never);

    expect(result).toEqual({ hit: false });
    expect(fetch).not.toHaveBeenCalled();
  });
});
