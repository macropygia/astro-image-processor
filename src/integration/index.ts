import type { AstroIntegration } from 'astro';
import sirv from 'sirv';

import type { ImgProcContext, ImgProcUserOptions } from '../types.js';
import { awaitProcessorContextReload } from './utils/awaitProcessorContextReload.js';
import { setDevUpgradeHotFromServer } from './utils/devUpgradeHot.js';
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
        const previousContext = globalThis.imageProcessorContext;
        if (command === 'dev' && previousContext) {
          await awaitProcessorContextReload({ previous: previousContext, logger });
        }

        // Init and create context
        globalThis.imageProcessorContext = await initProcessor({
          options,
          config,
          logger,
          command,
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
          experimental: {
            ...config.experimental,
            queuedRendering: {
              ...config.experimental?.queuedRendering,
              // Queued rendering buffers each component until render() completes,
              // which prevents progressive placeholder streaming in dev.
              enabled: command === 'build',
            },
          },
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
      'astro:server:setup': ({ server }) => {
        setDevUpgradeHotFromServer(server);
      },
      'astro:build:done': async () => {
        await pruneCache(globalThis.imageProcessorContext);
      },
    },
  };
};
