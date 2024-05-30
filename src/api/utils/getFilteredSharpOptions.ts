import type { Sharp } from "sharp";

import type { SharpWithOptions } from "../../types.js";

export function getFilteredSharpOptions(sharp: Sharp): Record<string, unknown> {
  const { debuglog, queueListener, input, ...rest } = (
    sharp as SharpWithOptions
  ).options;
  return rest;
}
