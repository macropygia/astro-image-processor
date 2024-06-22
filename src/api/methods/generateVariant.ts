import fs from "node:fs";
import path from "node:path";

import type { AstroIntegrationLogger } from "astro";
import type { Sharp } from "sharp";

import type { Ora } from "ora";
import { extByFormat } from "../../const.js";
import type {
  ImgProcDataAdapter,
  ImgProcHasher,
  ImgProcVariant,
} from "../../types.js";
import { applyProcessors } from "../utils/applyProcessors.js";
import { getMetadataFromBuffer } from "../utils/getMetadataFromBuffer.js";
import { normalizePath } from "../utils/normalizePath.js";
import { isOutputFormat } from "../utils/typeGuards.js";

type GenerateVariant = (args: {
  src: string;
  buffer: Buffer;
  db: ImgProcDataAdapter;
  hasher: ImgProcHasher;
  imageCacheDir: string;
  processor: Sharp | Sharp[] | undefined;
  variantProcessor: Sharp;
  variantProfileHash: string;
  sourceHash: string;
  variantWidth: number;
  variantDensity?: number | undefined;
  logger?: AstroIntegrationLogger | undefined;
  spinner: Ora;
}) => Promise<ImgProcVariant>;

export const generateVariant: GenerateVariant = async ({
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
}) => {
  const variantSharp = applyProcessors({
    processors: [processor, variantProcessor],
    buffer,
  });

  const variantBuffer = await variantSharp.toBuffer();
  const variantHash = hasher(variantBuffer);
  const variantMetadata = await getMetadataFromBuffer({
    buffer: variantBuffer,
  });
  const { format, width, height } = variantMetadata;

  if (!isOutputFormat(format)) {
    throw new Error("Invalid output format");
  }
  const ext = extByFormat[format];
  const imageCachePath = normalizePath(
    path.join(imageCacheDir, `${variantHash}.${ext}`),
  );

  // logger?.info(`Generated (${ext}, ${width}x${height}): ${src}`);

  await fs.promises.writeFile(imageCachePath, variantBuffer);

  await db.insert({
    hash: variantHash,
    category: "variant",
    format,
    width,
    height,
    source: sourceHash,
    profile: variantProfileHash,
  });

  return {
    hash: variantHash,
    width,
    height,
    format,
    ext,
    descriptor: variantDensity ? `${variantDensity}x` : `${variantWidth}w`,
  };
};
