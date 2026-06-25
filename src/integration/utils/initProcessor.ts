import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AstroConfig, AstroIntegrationLogger } from 'astro';

import { normalizePath } from '../../api/utils/normalizePath.js';
import { SharedSpinner } from '../../api/utils/SharedSpinner.js';
import { CompressionPool } from '../../api/workers/compressionPool.js';
import type { ImgProcContext, ImgProcContextDirectories, ImgProcUserOptions } from '../../types.js';
import { resolveOptions } from './resolveOptions.js';

type InitProcessor = (args: {
  options: ImgProcUserOptions | undefined;
  config: AstroConfig;
  logger?: AstroIntegrationLogger;
  command?: 'build' | 'dev' | 'preview' | 'sync';
}) => Promise<ImgProcContext>;

const resolvePoolMaxThreads = (
  settings: { concurrency: number; devConcurrency: number },
  command: 'dev' | 'build' | 'preview' | 'sync' | undefined,
): number | undefined => {
  if (command === 'dev') {
    return settings.devConcurrency;
  }
  if (command === 'build') {
    return settings.concurrency;
  }
  return undefined;
};

/**
 * Astro integration `astro:config:setup` hook
 * - Init database, store directories and inject vite plugin
 */
export const initProcessor: InitProcessor = async ({ options, config, logger, command }) => {
  const { componentProps, formatOptions, dataAdapter, ...settings } = resolveOptions(
    options,
    config,
  );

  logger?.info('Initializing integration...');

  const dirs: ImgProcContextDirectories = {
    rootDir: fileURLToPath(config.root.href),
    srcDir: fileURLToPath(config.srcDir.href),
    publicDir: fileURLToPath(config.publicDir.href),
    outDir: fileURLToPath(config.outDir.href),
    cacheDir: fileURLToPath(config.cacheDir.href),
    assetsDirName: config.build.assets,
    imageCacheDir: '',
    downloadDir: '',
    imageOutDir: '',
    imageAssetsDirName: '',
  };

  // Replace placeholders in image cache directory
  dirs.imageCacheDir = normalizePath(
    path.resolve(
      settings.imageCacheDirPattern
        .replaceAll('[root]', dirs.rootDir)
        .replaceAll('[cacheDir]', dirs.cacheDir),
    ),
    true,
  );

  await fs.promises.mkdir(dirs.imageCacheDir, { recursive: true });

  // Replace placeholders in download directory
  dirs.downloadDir = normalizePath(
    path.resolve(
      settings.downloadDirPattern
        .replaceAll('[root]', dirs.rootDir)
        .replaceAll('[cacheDir]', dirs.cacheDir)
        .replaceAll('[imageCacheDir]', dirs.imageCacheDir),
    ),
    true,
  );

  await fs.promises.mkdir(dirs.downloadDir, { recursive: true });

  // Replace placeholders in image output directory
  dirs.imageOutDir = normalizePath(
    path.resolve(
      settings.imageOutDirPattern
        .replaceAll('[root]', dirs.rootDir)
        .replaceAll('[outDir]', dirs.outDir),
    ),
    true,
  );

  // Replace placeholders in image assets directory
  dirs.imageAssetsDirName = normalizePath(
    path.resolve(settings.imageAssetsDirPattern.replaceAll('[assetsDirName]', dirs.assetsDirName)),
    true,
  );

  // Initialize database
  await dataAdapter.initialize({
    ...dirs,
    retentionPeriod: settings.retentionPeriod,
    retentionCount: settings.retentionCount,
  });

  logger?.info('Database initialized.');

  const maxThreads = resolvePoolMaxThreads(settings, command);
  const compressionPool = new CompressionPool(
    maxThreads !== undefined ? { maxThreads } : undefined,
  );
  const sharedSpinner = new SharedSpinner();

  const ctx: ImgProcContext = {
    // DB
    db: dataAdapter,
    // Default settings
    componentProps,
    formatOptions,
    settings,
    // Stored directories
    dirs,
    // Logger
    logger,
    compressionPool,
    sharedSpinner,
  };

  return ctx;
};
