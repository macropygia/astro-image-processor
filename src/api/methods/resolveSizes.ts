import type { BaseSource } from "../BaseSource.js";

type ResolveSizes = (source: BaseSource) => string;

export const resolveSizes: ResolveSizes = (source) => {
  const {
    data,
    options: { src, sizes, layout },
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

  if (typeof sizes === "string") {
    return sizes;
  }

  if (typeof sizes === "function") {
    return sizes(resolved.widths, resolved.densities);
  }

  // const maxWidth = resolved.widths.at(-1) as number; // NOTE: TypeScript issue

  switch (layout) {
    case "fixed":
      return `${resolved.width}px`;
    case "fill":
    case "fullWidth":
      return "100vw";
    case "constrained":
      return `(min-width: ${resolved.width}px) ${resolved.width}px, 100vw`;
    default:
      return `(min-width: ${resolved.width}px) ${resolved.width}px, 100vw`;
  }
};
