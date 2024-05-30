import sharp from "sharp";

import { applyProcessors } from "./applyProcessors.js";
import { resolveSharpFormat } from "./resolveSharpFormat.js";

type GetMetadataFromBuffer = (args: {
  buffer: Buffer;
  useDominant?: boolean;
  processor?: sharp.Sharp | sharp.Sharp[] | undefined;
}) => Promise<{
  format: string;
  width: number;
  height: number;
  r?: number;
  g?: number;
  b?: number;
}>;

/**
 * Get image metadata
 * - Use `sharp().metadata()` and `sharp().stats()` as needed.
 */
export const getMetadataFromBuffer: GetMetadataFromBuffer = async ({
  buffer,
  useDominant,
  processor,
}) => {
  const {
    format: sharpFormat,
    width,
    height,
    compression,
  } = await sharp(buffer).metadata();

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!sharpFormat || !width || !height) {
    throw new Error("Sharp could not retrieve metadata");
  }

  const format = resolveSharpFormat(sharpFormat, compression);
  if (useDominant) {
    const { r, g, b } = processor
      ? (await applyProcessors({ processors: [processor], buffer }).stats())
          .dominant
      : (await sharp(buffer).stats()).dominant;
    // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
    if (!r || !g || !b) {
      throw new Error("stats() failed");
    }
    return { format, width, height, r, g, b };
  }

  return { format, width, height };
};
