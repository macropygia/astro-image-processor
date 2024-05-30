import path from "node:path";

import { extByFormat } from "../../const.js";
import type { ImgProcFile } from "../../types.js";
import type { BaseSource } from "../BaseSource.js";
import { getMetadataFromBuffer } from "../utils/getMetadataFromBuffer.js";
import { normalizePath } from "../utils/normalizePath.js";
import { isOutputFormat } from "../utils/typeGuards.js";

type RenewSource = (source: BaseSource) => Promise<void>;

/** Process existing data */
export const renewSource: RenewSource = async (source) => {
  const {
    db,
    dirs,
    type,
    options: { src, placeholder, placeholderColor },
    data,
    logger,
  } = source;

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!data.hash || !data.format) {
    throw new Error("Invalid data");
  }

  let isDownloaded = false;

  if (type === "remote") {
    const ext = isOutputFormat(data.format)
      ? extByFormat[data.format]
      : data.format;
    source.downloadPath = normalizePath(
      path.join(dirs.downloadDir, `${data.hash}.${ext}`),
    );

    if (!data.expiresAt || data.expiresAt < Date.now()) {
      // Expired or no-cache
      // Re-download, update cache and update `expiresAt`
      await source.getBuffer();

      isDownloaded = true;
    }
  }

  // Get dominant color if needed
  if (
    isDownloaded ||
    (placeholder === "dominantColor" && !placeholderColor && !data.r)
  ) {
    logger?.info(`Re-download remote file or get dominant color: ${src}`);
    await updateMetadata(source);
  }

  await db.renew({ hash: data.hash });
};

export async function updateMetadata(source: BaseSource) {
  const {
    db,
    options: { placeholder, placeholderColor, processor },
    data,
  } = source;

  const buffer = await source.getBuffer();

  // Update metadata
  const metadata = await getMetadataFromBuffer({
    buffer,
    useDominant: placeholder === "dominantColor" && !placeholderColor,
    processor,
  });

  // Update instance data (remove old metadata)
  const { format, width, height, r, g, b, ...rest } = data;
  source.data = {
    ...rest,
    ...metadata,
  } as Partial<ImgProcFile>;

  // Update database
  await db.updateMetadata({
    hash: data.hash as string,
    ...metadata,
    ...(data.expiresAt ? { expiresAt: data.expiresAt } : undefined),
  });
}
