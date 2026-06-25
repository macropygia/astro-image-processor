import type { AstroIntegration } from 'astro';
import { type Mock, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { ImgProcUserOptions } from '../types.js';
import { astroImageProcessor } from './index.js';
import { initProcessor } from './utils/initProcessor.js';
import { pruneCache } from './utils/pruneCache.js';

vi.mock('./utils/initProcessor.js', () => ({
  initProcessor: vi.fn(),
}));

vi.mock('./utils/pruneCache.js');

describe('Unit/integration/astroImageProcessor', () => {
  let options: ImgProcUserOptions | undefined;
  let astroConfigSetupHook: any;
  let astroBuildDoneHook: any;

  beforeEach(() => {
    delete globalThis.imageProcessorContext;
    options = undefined;
    const integration: AstroIntegration = astroImageProcessor(options);
    astroConfigSetupHook = integration.hooks['astro:config:setup'];
    astroBuildDoneHook = integration.hooks['astro:build:done'];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('resolve plugin name', () => {
    const integration = astroImageProcessor(options);
    expect(integration.name).toBe('astro-image-processor');
  });

  test('register integration and vite plugin', async () => {
    const mockConfig = { someConfig: true };
    const mockUpdateConfig = vi.fn();
    const mockAddMiddleware = vi.fn();
    const mockLogger = { log: vi.fn(), info: vi.fn() };

    const mockContext = {
      db: { close: vi.fn() },
      settings: { devServerImageEndpoint: '/_aip' },
      dirs: { imageCacheDir: '/tmp/aip-cache' },
    };

    (initProcessor as Mock).mockResolvedValue(mockContext);

    await astroConfigSetupHook({
      config: mockConfig,
      updateConfig: mockUpdateConfig,
      addMiddleware: mockAddMiddleware,
      logger: mockLogger,
      command: 'build',
    });

    expect(initProcessor).toHaveBeenCalledWith({
      options,
      config: mockConfig,
      logger: mockLogger,
      command: 'build',
    });

    expect(globalThis.imageProcessorContext).toBe(mockContext);

    expect(mockAddMiddleware).toHaveBeenCalledWith({
      entrypoint: expect.any(URL),
      order: 'pre',
    });
  });

  test('logs dev inline style notice when command is dev', async () => {
    const mockLogger = { log: vi.fn(), info: vi.fn() };
    (initProcessor as Mock).mockResolvedValue({
      settings: { devServerImageEndpoint: '/_aip' },
      dirs: { imageCacheDir: '/tmp/aip-cache' },
    });

    await astroConfigSetupHook({
      config: {},
      updateConfig: vi.fn(),
      addMiddleware: vi.fn(),
      logger: mockLogger,
      command: 'dev',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Dev: <style> elements are rendered inline in the body for preview (not injected into <head>).',
    );
  });

  test('build done', () => {
    astroBuildDoneHook();

    expect(pruneCache).toHaveBeenCalled();
  });
});
