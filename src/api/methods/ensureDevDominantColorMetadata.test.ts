import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ensureDevDominantColorMetadata } from './ensureDevDominantColorMetadata.js';

vi.mock('../utils/getMetadataFromBuffer.js', () => ({
  getMetadataFromBuffer: vi.fn().mockResolvedValue({
    format: 'jpeg',
    width: 100,
    height: 80,
    r: 10,
    g: 20,
    b: 30,
  }),
}));

describe('ensureDevDominantColorMetadata', () => {
  const currentMode = import.meta.env.MODE;

  beforeEach(() => {
    import.meta.env.MODE = 'development';
    vi.clearAllMocks();
  });

  afterEach(() => {
    import.meta.env.MODE = currentMode;
  });

  test('loads dominant rgb from buffer when missing', async () => {
    const getBuffer = vi.fn().mockResolvedValue(Buffer.from('image'));
    const updateMetadata = vi.fn();
    const source = {
      options: { placeholder: 'dominantColor' as const, processor: undefined },
      data: { hash: 'source-hash' },
      db: { fetch: vi.fn().mockResolvedValue(null), updateMetadata },
      getBuffer,
    };

    await ensureDevDominantColorMetadata(source as never);

    expect(source.data).toMatchObject({ r: 10, g: 20, b: 30 });
    expect(updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ hash: 'source-hash', r: 10, g: 20, b: 30 }),
    );
  });

  test('skips when placeholderColor is provided', async () => {
    const getBuffer = vi.fn();
    const source = {
      options: { placeholder: 'dominantColor' as const, placeholderColor: 'rgb(1 2 3)' },
      data: {},
      db: { fetch: vi.fn() },
      getBuffer,
    };

    await ensureDevDominantColorMetadata(source as never);

    expect(getBuffer).not.toHaveBeenCalled();
  });
});
