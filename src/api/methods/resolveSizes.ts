import type { BaseSource } from "../BaseSource.js";

type ResolveSizes = (source: BaseSource) => string;

export const resolveSizes: ResolveSizes = (source) => {
  const {
    data,
    options: { src, sizes },
    resolved,
  } = source;

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!data.width || !data.height) {
    throw new Error(`Invalid source demiensions or widths: ${src}`);
  }

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!resolved.widths || !resolved.densities) {
    throw new Error(`Widths or densities unresolved: ${src}`);
  }

  if (!sizes) {
    const maxWidth = resolved.widths.at(-1) as number; // NOTE: TypeScript issue
    return `(min-width: ${maxWidth}px) ${maxWidth}px, 100vw`;
  }

  if (typeof sizes === "string") {
    return sizes;
  }

  return sizes(resolved.widths, resolved.densities);
};
