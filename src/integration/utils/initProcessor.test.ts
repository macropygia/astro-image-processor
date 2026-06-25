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
    expect(ctx.compressionPool.maxThreads).toBeUndefined();
    expect(ctx.sharedSpinner).toBeDefined();

    createdPools.push(ctx.compressionPool);

    rmdirSync(imageCacheDir);
    rmdirSync(downloadDir);
  });

  test('uses default devConcurrency of 3 during dev', async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: '__test__/image_cache_dir_dev_default',
        downloadDirPattern: '__test__/download_dir_dev_default',
      },
      config: mockAstroConfig,
      logger: mockLogger,
      command: 'dev',
    });

    expect(ctx.compressionPool.maxThreads).toBe(3);

    createdPools.push(ctx.compressionPool);

    rmdirSync(ctx.dirs.imageCacheDir);
    rmdirSync(ctx.dirs.downloadDir);
  });

  test('uses devConcurrency during dev', async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: '__test__/image_cache_dir_dev',
        downloadDirPattern: '__test__/download_dir_dev',
        devConcurrency: 4,
        concurrency: 8,
      },
      config: mockAstroConfig,
      logger: mockLogger,
      command: 'dev',
    });

    expect(ctx.compressionPool.maxThreads).toBe(4);

    createdPools.push(ctx.compressionPool);

    rmdirSync(ctx.dirs.imageCacheDir);
    rmdirSync(ctx.dirs.downloadDir);
  });

  test('uses concurrency during build', async () => {
    const ctx = await initProcessor({
      options: {
        imageCacheDirPattern: '__test__/image_cache_dir_build',
        downloadDirPattern: '__test__/download_dir_build',
        devConcurrency: 2,
        concurrency: 8,
      },
      config: mockAstroConfig,
      logger: mockLogger,
      command: 'build',
    });

    expect(ctx.compressionPool.maxThreads).toBe(8);

    createdPools.push(ctx.compressionPool);

    rmdirSync(ctx.dirs.imageCacheDir);
    rmdirSync(ctx.dirs.downloadDir);
  });
});
