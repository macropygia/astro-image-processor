import type { AstroIntegration } from 'astro';
import sirv from 'sirv';

import type { ImgProcContext, ImgProcUserOptions } from '../types.js';
import { initProcessor } from './utils/initProcessor.js';
import { pruneCache } from './utils/pruneCache.js';

declare global {
  var imageProcessorContext: ImgProcContext;
}

/**
 * Astro Image Processor Integration
 */
export const astroImageProcessor = (options?: ImgProcUserOptions): AstroIntegration => {
  return {
    name: 'astro-image-processor',
    hooks: {
      'astro:config:setup': async ({ config, logger, updateConfig, addMiddleware, command }) => {
        // Init and create context
        globalThis.imageProcessorContext = await initProcessor({
          options,
          config,
          logger,
        });
        addMiddleware({
          entrypoint: new URL('./middleware.ts', import.meta.url),
          order: 'pre',
        });
        if (command === 'dev') {
          logger.info(
            'Dev: <style> elements are rendered inline in the body for preview (not injected into <head>).',
          );
        }
        // Redirect compressed images to cache directory for dev server
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'astro-image-processor-image-endpoint',
                configureServer(server) {
                  // default: `/_aip` to cache directory
                  server.middlewares.use(
                    globalThis.imageProcessorContext.settings.devServerImageEndpoint,
                    sirv(globalThis.imageProcessorContext.dirs.imageCacheDir, {
                      dev: true,
                    }),
                  );
                },
              },
            ],
          },
        });
      },
      'astro:build:done': async () => {
        await pruneCache(globalThis.imageProcessorContext);
      },
    },
  };
};
