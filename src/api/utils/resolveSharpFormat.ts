import type sharp from "sharp";

export function resolveSharpFormat(
  sharpFormat: keyof sharp.FormatEnum,
  compression?: string,
): string {
  if (sharpFormat === "heif" && compression === "av1") {
    return "avif";
  }
  if (sharpFormat === "heif" && compression === "hevc") {
    return "heic";
  }
  if (sharpFormat === "svg") {
    throw new Error("SVG is not supported");
  }
  return sharpFormat;
}
