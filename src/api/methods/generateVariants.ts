import os from "node:os";

import pLimit from "p-limit";
import sharp from "sharp";

import type { ImgProcVariant, ImgProcVariants } from "../../types.js";
import type { BaseSource } from "../BaseSource.js";
import { deterministicHash } from "../utils/deterministicHash.js";
import { getFilteredSharpOptions } from "../utils/getFilteredSharpOptions.js";
import { generateVariant } from "./generateVariant.js";
import { retrieveVariant } from "./retrieveVariant.js";

const limit = pLimit(os.cpus().length);

type GenerateVariants = (source: BaseSource) => Promise<ImgProcVariants>;

export const generateVariants: GenerateVariants = async (source) => {
  const {
    db,
    dirs: { imageCacheDir },
    data: { hash: sourceHash },
    options: { src, format, formats, processor },
    formatOptions,
    resolved,
    settings: { hasher },
    logger,
  } = source;

  if (!sourceHash) {
    throw new Error("Source hash does not exist");
  }

  if (!resolved.widths) {
    throw new Error("Widths unresolved");
  }

  const variants: ImgProcVariants = {};
  const sourceProfile = source.profile;
  const formatsArray = source.componentType === "img" ? [format] : formats;

  const queue: Promise<ImgProcVariant>[] = [];

  for (const variantFormat of formatsArray) {
    const variantFormatOption = formatOptions[variantFormat];
    variants[variantFormat] = [];

    for (let index = 0; index < resolved.widths.length; index++) {
      const variantWidth = Math.round(resolved.widths[index] as number); // NOTE:
      const variantDensity = resolved.densities
        ? resolved.densities[index]
        : undefined;

      const variantProcessor = sharp()
        .resize(variantWidth)
        .toFormat(variantFormat, variantFormatOption);

      const variantProfile = [
        sourceProfile,
        getFilteredSharpOptions(variantProcessor),
      ]
        .flat()
        .filter(Boolean);
      const variantProfileHash = deterministicHash(variantProfile, hasher);

      // Cache
      const itemFromCache = await retrieveVariant({
        src,
        db,
        sourceHash,
        variantProfileHash,
        imageCacheDir,
        variantWidth,
        variantDensity,
        logger,
      });

      if (itemFromCache) {
        variants[variantFormat]?.push(itemFromCache);
        continue;
      }

      // New file
      const buffer = await source.getBuffer();
      queue.push(
        limit(() =>
          generateVariant({
            src,
            buffer,
            db,
            hasher,
            imageCacheDir,
            processor,
            variantProcessor,
            variantProfileHash,
            sourceHash,
            variantWidth,
            variantDensity,
            logger,
          }),
        ),
      );
    }
  }

  const generatedItems = await Promise.all(queue);
  for (const item of generatedItems) {
    variants[item.format]?.push(item);
  }

  let key: keyof ImgProcVariants;
  for (key in variants) {
    variants[key]?.sort((a, b) => a.width - b.width);
  }

  return variants;
};
