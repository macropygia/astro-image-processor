import type { BaseSource } from '../BaseSource.js';

type ResolveProvisionalSizes = (source: BaseSource) => string;

/** Resolve `sizes` from layout using provisional element width (before variants). */
export const resolveProvisionalSizes: ResolveProvisionalSizes = (source) => {
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

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!resolved.width) {
    throw new Error(`Provisional width unresolved: ${src}`);
  }

  if (typeof sizes === 'string') {
    return sizes;
  }

  if (typeof sizes === 'function') {
    return sizes(resolved.widths, resolved.densities);
  }

  switch (layout) {
    case 'fixed':
      return `${resolved.width}px`;
    case 'fill':
    case 'fullWidth':
      return '100vw';
    case 'constrained':
      return `(min-width: ${resolved.width}px) ${resolved.width}px, 100vw`;
    default:
      return `(min-width: ${resolved.width}px) ${resolved.width}px, 100vw`;
  }
};
