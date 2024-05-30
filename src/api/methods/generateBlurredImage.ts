import sharp from "sharp";

import type { BaseSource } from "../BaseSource.js";
import { applyProcessors } from "../utils/applyProcessors.js";
import { deterministicHash } from "../utils/deterministicHash.js";
import { getFilteredSharpOptions } from "../utils/getFilteredSharpOptions.js";
import { getMetadataFromBuffer } from "../utils/getMetadataFromBuffer.js";

type GenerateBlurredImage = (source: BaseSource) => Promise<string>;

/**
 * Generate blurred image
 * - If exists on the database, return it.
 * @param param0
 * @returns
 */
export const generateBlurredImage: GenerateBlurredImage = async (source) => {
  const {
    db,
    data: { hash: sourceHash },
    options: { processor: sourceProcessor, blurProcessor },
    settings: { hasher },
    logger,
  } = source;

  if (!sourceHash) {
    throw new Error("Source hash does not exist");
  }

  const sourceProfile = source.profile;
  const profile = deterministicHash(
    [sourceProfile, getFilteredSharpOptions(blurProcessor)]
      .flat()
      .filter(Boolean),
    hasher,
  );

  const data = await db.fetch({ source: sourceHash, profile });
  if (data?.base64) {
    await db.renew({ source: sourceHash, profile });
    logger?.info(`Cache hit (placeholder): ${source.options.src}`);
    return `data:image/${data.format};base64,${data.base64}`;
  }

  const buffer = await source.getBuffer();
  const sourceSharp = sourceProcessor
    ? applyProcessors({ processors: [sourceProcessor], buffer })
    : sharp(buffer);
  const blurredBuffer = await sourceSharp
    .pipe(blurProcessor.clone())
    .toBuffer();
  const metadata = await getMetadataFromBuffer({ buffer: blurredBuffer });
  const { format, width, height } = metadata;

  logger?.info(`Generated (placeholder): ${source.options.src}`);

  const blurredHash = hasher(blurredBuffer);
  const base64 = blurredBuffer.toString("base64");

  await db.insert({
    hash: blurredHash,
    base64,
    category: "placeholder",
    format,
    width,
    height,
    source: sourceHash,
    profile,
  });

  return `data:image/${format};base64,${base64}`;
};
