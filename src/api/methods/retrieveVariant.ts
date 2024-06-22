import path from "node:path";

import type { AstroIntegrationLogger } from "astro";

import type { Ora } from "ora";
import { extByFormat } from "../../const.js";
import type { ImgProcDataAdapter, ImgProcVariant } from "../../types.js";
import { pathExists } from "../utils/pathExists.js";
import { isOutputFormat } from "../utils/typeGuards.js";

type RetrieveVariant = (args: {
  src: string;
  db: ImgProcDataAdapter;
  sourceHash: string;
  variantProfileHash: string;
  imageCacheDir: string;
  variantWidth: number;
  variantDensity?: number | undefined;
  logger?: AstroIntegrationLogger | undefined;
  spinner: Ora;
}) => Promise<ImgProcVariant | null>;

export const retrieveVariant: RetrieveVariant = async ({
  db,
  sourceHash,
  variantProfileHash,
  imageCacheDir,
  variantWidth,
  variantDensity,
}) => {
  const variantData = await db.fetch({
    source: sourceHash,
    profile: variantProfileHash,
  });

  if (!variantData) {
    return null;
  }

  const { hash, format, width, height } = variantData;
  if (!isOutputFormat(format)) {
    throw new Error("Invalid output format");
  }
  const ext = extByFormat[format];
  const imageCachePath = path.join(imageCacheDir, `${hash}.${ext}`);

  if ((await pathExists(imageCachePath)) && width === variantWidth) {
    // logger?.info(`Cache hit (${ext} ${width}x${height}): ${src}`);

    await db.renew({
      source: sourceHash,
      profile: variantProfileHash,
    });

    return {
      hash,
      width,
      height,
      format,
      ext,
      descriptor: variantDensity ? `${variantDensity}x` : `${variantWidth}w`,
    };
  }
  await db.delete({ source: sourceHash, profile: variantProfileHash });
  return null;
};
