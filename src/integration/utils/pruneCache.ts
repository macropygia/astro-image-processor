import fs from "node:fs";
import path from "node:path";

import type { AstroIntegrationLogger } from "astro";

import type { ImgProcContext } from "../../types.js";

type PruneCache = (ctx: ImgProcContext) => Promise<void>;

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
    logger?.info("No expired file found");
  }

  await db.close();
};

export async function deleteOutdatedImages(
  dir: string,
  targetHashes: Set<string>,
  logger?: AstroIntegrationLogger,
) {
  await fs.promises
    .readdir(dir, { withFileTypes: true })
    .then(async (dirents) => {
      await Promise.all(
        dirents.map((dirent) => {
          if (!dirent.isFile()) {
            return;
          }

          const pathParts = path.parse(dirent.name);

          if (targetHashes.has(pathParts.name)) {
            logger?.info(`Delete outdated cache: ${dirent.name}`);
            return fs.promises.unlink(
              path.join(dirent.parentPath, dirent.name),
            );
          }

          return;
        }),
      );
    });
}
