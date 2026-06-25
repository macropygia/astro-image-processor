import fs from 'node:fs';
import path from 'node:path';

import type { AstroIntegrationLogger } from 'astro';
import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import { mockContext } from '#mock/mock.js';

import { deleteOrphanCacheFiles, deleteOutdatedImages, pruneCache } from './pruneCache.js';

vi.mock('node:fs', () => ({
  default: {
    promises: {
      readdir: vi.fn(),
      unlink: vi.fn(),
    },
  },
}));

const mockDb = mockContext.db;
const mockLogger = mockContext.logger as AstroIntegrationLogger;

describe('Unit/integration/utils/pruneCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('default', async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(new Set(['hash3']));
    (mockDb.list as Mock).mockReturnValue(new Set(['hash1', 'hash3']));
    (fs.promises.readdir as Mock).mockResolvedValue([
      { name: 'hash1.avif', isFile: () => true, parentPath: '/path/to/' },
      { name: 'dir', isFile: () => false, parentPath: '/path/to/' },
      { name: 'hash3.webp', isFile: () => true, parentPath: '/path/to/' },
    ]);

    await pruneCache(mockContext);

    expect(fs.promises.readdir).toHaveBeenCalledWith('cache/', {
      withFileTypes: true,
    });
    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join('/path/to/', 'hash3.webp'));
    expect(mockLogger.info).toHaveBeenCalledWith('Delete outdated cache: hash3.webp');
    expect(mockDb.close).toHaveBeenCalled();
  });

  test('deleted', async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(new Set(['mock-hash3-hash']));
    (mockDb.list as Mock).mockReturnValue(new Set());
    (fs.promises.readdir as Mock).mockResolvedValue([]);
    await pruneCache(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith('1 files expired');
  });

  test('none', async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(null);
    (mockDb.list as Mock).mockReturnValue(new Set());
    (fs.promises.readdir as Mock).mockResolvedValue([]);
    await pruneCache(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith('No expired file found');
  });

  test('removes orphan cache files not in db', async () => {
    (mockDb.deleteExpiredRecords as Mock).mockResolvedValue(null);
    (mockDb.list as Mock).mockReturnValue(new Set(['hash1']));
    (fs.promises.readdir as Mock)
      .mockResolvedValueOnce([
        { name: 'hash1.webp', isFile: () => true, parentPath: '/cache/' },
        { name: 'orphan.avif', isFile: () => true, parentPath: '/cache/' },
        { name: 'notes.txt', isFile: () => true, parentPath: '/cache/' },
      ])
      .mockResolvedValueOnce([]);

    await pruneCache(mockContext);

    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join('/cache/', 'orphan.avif'));
    expect(fs.promises.unlink).not.toHaveBeenCalledWith(path.join('/cache/', 'hash1.webp'));
    expect(fs.promises.unlink).not.toHaveBeenCalledWith(path.join('/cache/', 'notes.txt'));
    expect(mockLogger.info).toHaveBeenCalledWith('1 orphan cache file(s) removed');
  });
});

describe('Unit/integration/utils/deleteOutdatedImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('default', async () => {
    const parentPath = '/mock/dir';
    const hashes = new Set(['hash3']);
    (fs.promises.readdir as Mock).mockResolvedValue([
      { name: 'hash1.avif', isFile: () => true, parentPath },
      { name: 'hash3.webp', isFile: () => true, parentPath },
      { name: 'not_an_image.txt', isFile: () => true, parentPath },
    ]);

    await deleteOutdatedImages(parentPath, hashes, mockLogger);

    expect(fs.promises.readdir).toHaveBeenCalledWith(parentPath, {
      withFileTypes: true,
    });
    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join(parentPath, 'hash3.webp'));
    expect(mockLogger.info).toHaveBeenCalledWith('Delete outdated cache: hash3.webp');
    expect(fs.promises.unlink).not.toHaveBeenCalledWith(path.join(parentPath, 'not_an_image.txt'));
  });
});

describe('Unit/integration/utils/deleteOrphanCacheFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes only known image extensions missing from db', async () => {
    const parentPath = '/mock/dir';
    const knownHashes = new Set(['tracked']);
    (fs.promises.readdir as Mock).mockResolvedValue([
      { name: 'tracked.webp', isFile: () => true, parentPath },
      { name: 'orphan.webp', isFile: () => true, parentPath },
      { name: 'readme.txt', isFile: () => true, parentPath },
    ]);

    const removed = await deleteOrphanCacheFiles(parentPath, knownHashes, mockLogger);

    expect(removed).toBe(1);
    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join(parentPath, 'orphan.webp'));
    expect(mockLogger.info).toHaveBeenCalledWith('Delete orphan cache: orphan.webp');
  });

  test('returns 0 when directory is missing', async () => {
    (fs.promises.readdir as Mock).mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );

    const removed = await deleteOrphanCacheFiles('/missing', new Set(), mockLogger);

    expect(removed).toBe(0);
    expect(fs.promises.unlink).not.toHaveBeenCalled();
  });
});
