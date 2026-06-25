import fs from 'node:fs';
import path from 'node:path';

import type { AstroIntegrationLogger } from 'astro';

import { extByFormat } from '../../const.js';
import type { ImgProcContext } from '../../types.js';

type PruneCache = (ctx: ImgProcContext) => Promise<void>;

const knownCacheExtensions = new Set(Object.values(extByFormat));

export const pruneCache: PruneCache = async (ctx) => {
  const {
    db,
    dirs: { imageCacheDir, downloadDir },
    logger,
  } = ctx;

  await db.countdown();
  const deletedHashes = await db.deleteExpiredRecords(Date.now());

  if (deletedHashes) {
    logger?.info(`${deletedHashes.size} files expired`);
    await deleteOutdatedImages(imageCacheDir, deletedHashes, logger);
    await deleteOutdatedImages(downloadDir, deletedHashes, logger);
  } else {
    logger?.info('No expired file found');
  }

  const knownHashes = await db.list();
  const orphanCount =
    (await deleteOrphanCacheFiles(imageCacheDir, knownHashes, logger)) +
    (await deleteOrphanCacheFiles(downloadDir, knownHashes, logger));

  if (orphanCount > 0) {
    logger?.info(`${orphanCount} orphan cache file(s) removed`);
  }

  await db.close();
};

export async function deleteOutdatedImages(
  dir: string,
  targetHashes: Set<string>,
  logger?: AstroIntegrationLogger,
) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  await Promise.all(
    dirents
      .filter((dirent) => dirent.isFile() && targetHashes.has(path.parse(dirent.name).name))
      .map((dirent) => {
        logger?.info(`Delete outdated cache: ${dirent.name}`);
        return fs.promises.unlink(path.join(dirent.parentPath, dirent.name));
      }),
  );
}

/** Remove cache files on disk that have no matching hash in the DB. */
export async function deleteOrphanCacheFiles(
  dir: string,
  knownHashes: Set<string>,
  logger?: AstroIntegrationLogger,
): Promise<number> {
  let dirents: fs.Dirent[];
  try {
    dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 0;
    }
    throw error;
  }

  let removed = 0;
  await Promise.all(
    dirents
      .filter((dirent) => dirent.isFile())
      .map(async (dirent) => {
        const parsed = path.parse(dirent.name);
        const ext = parsed.ext.slice(1);
        if (!ext || !knownCacheExtensions.has(ext)) {
          return;
        }
        if (knownHashes.has(parsed.name)) {
          return;
        }
        logger?.info(`Delete orphan cache: ${dirent.name}`);
        await fs.promises.unlink(path.join(dirent.parentPath, dirent.name));
        removed += 1;
      }),
  );
  return removed;
}
