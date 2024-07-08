import sharp from "sharp";

import PQueue from "p-queue";
import type { ImgProcVariant, ImgProcVariants } from "../../types.js";
import type { BaseSource } from "../BaseSource.js";
import { deterministicHash } from "../utils/deterministicHash.js";
import { getFilteredSharpOptions } from "../utils/getFilteredSharpOptions.js";
import { generateVariant } from "./generateVariant.js";
import { retrieveVariant } from "./retrieveVariant.js";

type GenerateVariants = (source: BaseSource) => Promise<ImgProcVariants>;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export const generateVariants: GenerateVariants = async (source) => {
  const {
    componentType,
    db,
    dirs: { imageCacheDir },
    data: { hash: sourceHash },
    options: { src, densities, format, formats, processor },
    formatOptions,
    resolved,
    settings: { concurrency, hasher },
    logger,
    spinner,
    profile,
  } = source;

  if (!sourceHash) {
    throw new Error("Source hash does not exist");
  }

  if (!resolved.widths) {
    throw new Error("Widths unresolved");
  }

  const variants: ImgProcVariants = {};
  const formatsArray = componentType === "img" ? [format] : formats;

  // const queue: Promise<ImgProcVariant>[] = [];
  const total = resolved.widths.length * formatsArray.length;
  const queue = new PQueue({ concurrency });
  queue.on("add", () => {
    spinner.text = `Processing... (${total - queue.size - queue.pending}/${total})`;
  });
  queue.on("next", () => {
    spinner.text = `Processing... (${total - queue.size - queue.pending}/${total})`;
  });

  // biome-ignore lint/suspicious/noConfusingVoidType: p-queue issue
  const results: Promise<void | ImgProcVariant>[] = [];

  for (const variantFormat of formatsArray) {
    const variantFormatOption = formatOptions[variantFormat];
    variants[variantFormat] = [];

    for (let index = 0; index < resolved.widths.length; index++) {
      const variantWidth = Math.round(resolved.widths[index] as number);
      const variantDensity =
        densities && resolved.densities ? resolved.densities[index] : undefined;

      const variantProcessor = sharp()
        .resize(variantWidth)
        .toFormat(variantFormat, variantFormatOption);

      const variantProfile = [
        profile,
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
        spinner,
      });

      if (itemFromCache) {
        variants[variantFormat]?.push(itemFromCache);
        continue;
      }

      // New file
      const buffer = await source.getBuffer();
      const result = queue.add(() =>
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
          spinner,
        }),
      );
      results.push(result);
    }
  }

  await queue.onIdle();
  const generatedItems = await Promise.all(results);
  for (const item of generatedItems) {
    if (!item) {
      continue;
    }
    variants[item.format]?.push(item);
  }

  let key: keyof ImgProcVariants;
  for (key in variants) {
    variants[key]?.sort((a, b) => a.width - b.width);
  }

  return variants;
};
