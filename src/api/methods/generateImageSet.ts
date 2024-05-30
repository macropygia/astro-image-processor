import type { BaseSource } from "../BaseSource.js";

/**
 * Generate `image-set()` from the source
 * @param this BaseSource instance
 * @returns CSS string
 */
export function generateImageSet(this: BaseSource): string {
  const variants = this.variants;
  const { src, formats } = this.options;

  if (!variants) {
    throw new Error(`Variants unresolved: ${src}`);
  }

  const imageSet: string[] = [];
  formats.map((format) => {
    const variant = variants[format];

    if (!variant) {
      throw new Error(`Format mismatch: ${src}`);
    }

    const setByFormat = variant
      .map(
        (item) =>
          `url("${this.resolvePath(item)}") ${
            item.descriptor?.endsWith("w") ? "1x" : item.descriptor
          } type("image/${format}")`,
      )
      .join(",");

    imageSet.push(setByFormat);
  });

  return `image-set(${imageSet.join(",")})`;
}
