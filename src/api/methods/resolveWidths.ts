import type { BaseSource } from "../BaseSource.js";
import { isFirstElementNumber } from "../utils/typeGuards.js";

type ResolveWidths = (source: BaseSource) => void;

/**
 * Resolve widths and densities
 * - Set `resolved.widths` and `resolved.densities`
 */
export const resolveWidths: ResolveWidths = (source) => {
  const {
    data,
    options: { src, width, widths, densities, upscale },
    resolved,
  } = source;

  // biome-ignore lint/complexity/useSimplifiedLogicExpression: Biome issue
  if (!data.width || !data.height) {
    throw new Error(`Invalid source demiensions: ${src}`);
  }

  if (widths && densities) {
    throw new Error(`Both widths and densities exist: ${src}`);
  }

  if (widths) {
    resolved.widths = filterWidths(widths, data.width, upscale);
    resolved.densities = resolved.widths.map(
      (w) => w / (width || (data.width as number)),
    ) as [number, ...number[]];
    return;
  }

  if (densities) {
    const { resolvedWidths, resolvedDensities } = convertDensitiesToWidths(
      densities,
      data.width,
      upscale,
      width,
    );
    resolved.widths = resolvedWidths;
    resolved.densities = resolvedDensities;
    return;
  }

  // Both widths and dencities are not set
  resolved.widths = [width || data.width];
  resolved.densities = [1];
};

/**
 * Convert densities to widths
 */
export function convertDensitiesToWidths(
  densities: number[],
  dataWidth: number, // real width
  upscale: "never" | "always" | "original",
  width?: number | undefined, // width prop
): {
  resolvedWidths: [number, ...number[]];
  resolvedDensities: [number, ...number[]];
} {
  densities.sort((a, b) => a - b);

  const baseWidth = width || dataWidth / Math.max(...densities);

  const widthsByDensities: number[] = [];
  const filteredDensities: number[] = [];

  for (const density of densities) {
    if (upscale === "always" || baseWidth * density <= dataWidth) {
      widthsByDensities.push(baseWidth * density);
      filteredDensities.push(density);
    }
  }
  if (upscale === "original" && widthsByDensities.at(-1) !== dataWidth) {
    widthsByDensities.push(dataWidth);
    filteredDensities.push(dataWidth / baseWidth);
  }

  if (
    isFirstElementNumber(widthsByDensities) &&
    isFirstElementNumber(filteredDensities)
  ) {
    return {
      resolvedWidths: widthsByDensities,
      resolvedDensities: filteredDensities,
    };
  }

  throw new Error(
    "Nothing to output (minimum specified width is greater than real width)",
  );
}

/**
 * Filter widths
 */
export function filterWidths(
  widths: number[],
  dataWidth: number,
  upscale: "never" | "always" | "original",
): [number, ...number[]] {
  widths.sort((a, b) => a - b);
  const filteredWidths =
    upscale === "always" ? widths : widths.filter((w) => w <= dataWidth);

  if (upscale === "original" && filteredWidths.at(-1) !== dataWidth) {
    filteredWidths.push(dataWidth);
  }

  if (isFirstElementNumber(filteredWidths)) {
    return filteredWidths;
  }

  throw new Error(
    "Nothing to output (minimum specified width is greater than real width)",
  );
}
