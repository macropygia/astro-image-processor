import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, test } from 'vitest';

import { CompressionPool } from './compressionPool.js';

const pools: CompressionPool[] = [];

afterEach(async () => {
  await Promise.all(pools.map((pool) => pool.destroy()));
  pools.length = 0;
});

describe('CompressionPool', () => {
  test('runs variant jobs and writes cache files', async () => {
    const imageCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aip-compression-'));
    const pool = new CompressionPool({ maxThreads: 1 });
    pools.push(pool);

    const buffer = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: { r: 120, g: 80, b: 40 },
      },
    })
      .png()
      .toBuffer();

    const result = await pool.runVariant({
      buffer,
      imageCacheDir,
      sourceProfiles: [],
      variantWidth: 20,
      variantFormat: 'webp',
      variantFormatOptions: { quality: 80 },
    });

    expect(result.format).toBe('webp');
    expect(result.width).toBe(20);
    expect(fs.existsSync(path.join(imageCacheDir, `${result.hash}.${result.ext}`))).toBe(true);

    fs.rmSync(imageCacheDir, { recursive: true, force: true });
  });

  test('maps sharp heif metadata to avif output format', async () => {
    const imageCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aip-compression-'));
    const pool = new CompressionPool({ maxThreads: 1 });
    pools.push(pool);

    const buffer = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: { r: 120, g: 80, b: 40 },
      },
    })
      .png()
      .toBuffer();

    const result = await pool.runVariant({
      buffer,
      imageCacheDir,
      sourceProfiles: [],
      variantWidth: 20,
      variantFormat: 'avif',
      variantFormatOptions: { quality: 50 },
    });

    expect(result.format).toBe('avif');
    expect(result.ext).toBe('avif');
    expect(fs.existsSync(path.join(imageCacheDir, `${result.hash}.${result.ext}`))).toBe(true);

    fs.rmSync(imageCacheDir, { recursive: true, force: true });
  });

  test('runs blur jobs and returns base64 metadata', async () => {
    const pool = new CompressionPool({ maxThreads: 1 });
    pools.push(pool);

    const buffer = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const result = await pool.runBlur({
      buffer,
      sourceProfiles: [],
      resizeWidth: 10,
      format: 'webp',
      formatOptions: { quality: 1 },
    });

    expect(result.format).toBe('webp');
    expect(result.base64.length).toBeGreaterThan(0);
    expect(result.hash.length).toBeGreaterThan(0);
  });
});
