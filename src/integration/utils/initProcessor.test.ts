import { existsSync, rmdirSync } from 'node:fs';

import { afterEach, describe, expect, test } from 'vitest';

import { mockAstroConfig, mockLogger } from '#mock/mock.js';

import { initProcessor } from './initProcessor.js';

const createdPools: Array<{ destroy: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(createdPools.map((pool) => pool.destroy()));
  createdPools.length = 0;
});

describe('Unit/intergration/initProcessor', () => {
  test('default', async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: '__test__/image_cache_dir',
        downloadDirPattern: '__test__/download_dir',
      },
      config: mockAstroConfig,
      logger: mockLogger,
    });

    const { dirs } = ctx;
    const { rootDir, srcDir, publicDir, outDir, cacheDir, imageCacheDir, downloadDir } = dirs;

    expect(rootDir).toBe('/mock/root/');
    expect(srcDir).toBe('/mock/root/src/');
    expect(publicDir).toBe('/mock/root/public/');
    expect(cacheDir).toBe('/mock/root/cache/');
    expect(imageCacheDir.endsWith('__test__/image_cache_dir/')).toBeTruthy();
    expect(downloadDir.endsWith('__test__/download_dir/')).toBeTruthy();
    expect(outDir).toBe('/mock/root/dist/');

    expect(existsSync(imageCacheDir)).toBeTruthy();
    expect(existsSync(downloadDir)).toBeTruthy();

    expect(ctx.compressionPool).toBeDefined();
    expect(ctx.compressionPool.maxThreads).toBe(ctx.settings.concurrency);
    expect(ctx.sharedSpinner).toBeDefined();

    createdPools.push(ctx.compressionPool);

    rmdirSync(imageCacheDir);
    rmdirSync(downloadDir);
  });

  test('uses concurrency as pool maxThreads', async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: '__test__/image_cache_dir_concurrency',
        downloadDirPattern: '__test__/download_dir_concurrency',
        concurrency: 8,
      },
      config: mockAstroConfig,
      logger: mockLogger,
    });

    expect(ctx.compressionPool.maxThreads).toBe(8);

    createdPools.push(ctx.compressionPool);

    rmdirSync(ctx.dirs.imageCacheDir);
    rmdirSync(ctx.dirs.downloadDir);
  });
});
