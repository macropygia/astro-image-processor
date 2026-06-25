import type { Ora } from 'ora';
import { afterAll, describe, expect, test, vi } from 'vitest';

import { createSyncCompressionPool } from '#mock/mock.js';

import type { ImgProcDataAdapter } from '../../types.js';
import { generateVariant } from './generateVariant.js';

const mockDb = {
  insert: vi.fn(),
  fetch: vi.fn(),
};

const mockSpinner = {
  text: vi.fn(),
} as unknown as Ora;

vi.mock('../../const.js', () => ({
  extByFormat: {
    jpeg: 'jpg',
    png: 'png',
    webp: 'webp',
    avif: 'avif',
    heif: 'avif',
    gif: 'gif',
  },
}));

const compressionPool = createSyncCompressionPool();

describe('Unit/api/methods/generateVariant', () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  test('default', async () => {
    const buffer = Buffer.from('test buffer');
    const resultMetadata = {
      hash: 'variantHash',
      width: 800,
      height: 600,
      format: 'jpeg' as const,
      ext: 'jpg',
    };

    vi.spyOn(compressionPool, 'runVariant').mockResolvedValue(resultMetadata);

    const result = await generateVariant({
      src: 'test.jpg',
      buffer,
      db: mockDb as unknown as ImgProcDataAdapter,
      hasher: vi.fn(),
      imageCacheDir: 'cache/dir',
      processor: undefined,
      variantWidth: 800,
      variantFormat: 'jpeg',
      variantProfileHash: 'variantProfileHash',
      sourceHash: 'sourceHash',
      variantDensity: 1,
      spinner: mockSpinner,
      compressionPool,
    });

    expect(compressionPool.runVariant).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalledWith({
      hash: resultMetadata.hash,
      category: 'variant',
      format: 'jpeg',
      width: 800,
      height: 600,
      source: 'sourceHash',
      profile: 'variantProfileHash',
    });
    expect(result).toEqual({
      hash: 'variantHash',
      width: 800,
      height: 600,
      format: 'jpeg',
      ext: 'jpg',
      descriptor: '1x',
    });

    const resultWithWidth = await generateVariant({
      src: 'test.jpg',
      buffer,
      db: mockDb as unknown as ImgProcDataAdapter,
      hasher: vi.fn(),
      imageCacheDir: 'cache/dir',
      processor: undefined,
      variantWidth: 800,
      variantFormat: 'jpeg',
      variantProfileHash: 'variantProfileHash',
      sourceHash: 'sourceHash',
      spinner: mockSpinner,
      compressionPool,
    });
    expect(resultWithWidth).toEqual({
      hash: 'variantHash',
      width: 800,
      height: 600,
      format: 'jpeg',
      ext: 'jpg',
      descriptor: '800w',
    });
  });

  test('throw', async () => {
    const buffer = Buffer.from('test buffer');

    vi.spyOn(compressionPool, 'runVariant').mockResolvedValue({
      hash: 'variantHash',
      width: 800,
      height: 600,
      format: 'jpeg',
      ext: 'jpg',
    });
    mockDb.insert.mockRejectedValue(new Error('DB insert error'));

    await expect(() =>
      generateVariant({
        src: 'test.jpg',
        buffer,
        db: mockDb as unknown as ImgProcDataAdapter,
        hasher: vi.fn(),
        imageCacheDir: 'cache/dir',
        processor: undefined,
        variantWidth: 800,
        variantFormat: 'jpeg',
        variantProfileHash: 'variantProfileHash',
        sourceHash: 'sourceHash',
        variantDensity: 1,
        spinner: mockSpinner,
        compressionPool,
      }),
    ).rejects.toThrowError('DB insert error');
  });
});
