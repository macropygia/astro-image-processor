import type { ImgProcFormatOptions, ImgProcVariant } from "../../types.js";
import type { BaseSource } from "../BaseSource.js";

type ResolveElementDimensions = (source: BaseSource) => void;

/**
 * Resolve element width and height based on processed image
 */
export const resolveElementDimensions: ResolveElementDimensions = (source) => {
  const {
    data,
    options: { src, width, height, format, formats },
    resolved,
    variants,
    componentType,
  } = source;

  if (!variants) {
    throw new Error(`Variants unresolved: ${src}`);
  }
  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!data.width || !data.height) {
    throw new Error(`Invalid source demiensions: ${src}`);
  }

  const fallbackFormat = (
    componentType === "img" ? format : formats.at(-1)
  ) as keyof ImgProcFormatOptions;
  const variant = variants[fallbackFormat] as ImgProcVariant[];
  const variantItem =
    variant.find((v) => v.width === width) ||
    variant.find((v) => v.width === data.width) ||
    (variant.at(-1) as ImgProcVariant);

  let elementWidth: number;
  let elementHeight: number;

  if (width && height) {
    elementWidth = width;
    elementHeight = height;
  } else if (width && !height) {
    elementWidth = width;
    elementHeight = width * (variantItem.height / variantItem.width);
  } else if (!width && height) {
    elementWidth = height * (variantItem.width / variantItem.height);
    elementHeight = height;
  } else {
    elementWidth = variantItem.width;
    elementHeight = variantItem.height;
  }

  resolved.width = elementWidth;
  resolved.height = elementHeight;
};
