import type { Sharp } from "sharp";

import type { SharpWithOptions } from "../../types.js";

/**
 * Filter unnecessary properties from sharp instance options
 * - based on sharp@0.33.4
 */
export function getFilteredSharpOptions(sharp: Sharp): Record<string, unknown> {
  const { debuglog, queueListener, input, ...rest } = (
    sharp as SharpWithOptions
  ).options;
  return rest;
}
