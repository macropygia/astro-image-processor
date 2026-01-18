import type { AstroIntegration } from "astro";

import type { ImgProcContext, ImgProcUserOptions } from "../types.js";
import { initProcessor } from "./utils/initProcessor.js";
import { pruneCache } from "./utils/pruneCache.js";

declare global {
  var imageProcessorContext: ImgProcContext;
}

/**
 * Astro Image Processor Integration
 */
export const astroImageProcessor = (
  options?: ImgProcUserOptions,
): AstroIntegration => {
  return {
    name: "astro-image-processor",
    hooks: {
      "astro:config:setup": async ({ config, logger }) => {
        // Init and create context
        globalThis.imageProcessorContext = await initProcessor({
          options,
          config,
          logger,
        });
      },
      "astro:build:done": async () => {
        await pruneCache(globalThis.imageProcessorContext);
      },
    },
  };
};
