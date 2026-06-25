import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { extByFormat } from '../../const.js';
import { cryptoHasher } from '../../extras/cryptoHasher.js';
import { peekVariant } from './peekVariant.js';

describe('peekVariant', () => {
  let imageCacheDir: string;

  beforeEach(() => {
    imageCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aip-peek-'));
  });

  afterEach(() => {
    fs.rmSync(imageCacheDir, { recursive: true, force: true });
  });

  test('returns variant without db.renew or db.delete on hit', async () => {
    const buffer = await sharp({
      create: { width: 20, height: 10, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .webp()
      .toBuffer();
    const hash = cryptoHasher(buffer);
    const ext = extByFormat.webp;
    await fs.promises.writeFile(path.join(imageCacheDir, `${hash}.${ext}`), buffer);

    const renew = vi.fn();
    const deleteFn = vi.fn();
    const fetch = vi.fn().mockResolvedValue({
      hash,
      format: 'webp',
      width: 20,
      height: 10,
      source: 'source-hash',
      profile: 'profile-hash',
    });

    const result = await peekVariant({
      db: { fetch, renew, delete: deleteFn } as never,
      sourceHash: 'source-hash',
      variantProfileHash: 'profile-hash',
      imageCacheDir,
      variantWidth: 20,
    });

    expect(result).toMatchObject({
      hash,
      width: 20,
      height: 10,
      format: 'webp',
      ext: 'webp',
      descriptor: '20w',
    });
    expect(renew).not.toHaveBeenCalled();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  test('returns null on cache miss without deleting stale db records', async () => {
    const deleteFn = vi.fn();
    const fetch = vi.fn().mockResolvedValue(null);

    const result = await peekVariant({
      db: { fetch, delete: deleteFn } as never,
      sourceHash: 'source-hash',
      variantProfileHash: 'profile-hash',
      imageCacheDir,
      variantWidth: 20,
    });

    expect(result).toBeNull();
    expect(deleteFn).not.toHaveBeenCalled();
  });
});
