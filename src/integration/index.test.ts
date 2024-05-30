import type { AstroIntegration } from "astro";
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import type { ImgProcUserOptions } from "../types.js";
import { astroImageProcessor } from "./index.js";
import { initProcessor } from "./utils/initProcessor.js";
import { pruneCache } from "./utils/pruneCache.js";

vi.mock("./utils/initProcessor.js", () => ({
  initProcessor: vi.fn(),
}));

vi.mock("./utils/pruneCache.js");

describe("Unit/integration/astroImageProcessor", () => {
  let options: ImgProcUserOptions | undefined;
  let astroConfigSetupHook: any;
  let astroBuildDoneHook: any;

  beforeEach(() => {
    options = undefined;
    const integration: AstroIntegration = astroImageProcessor(options);
    astroConfigSetupHook = integration.hooks["astro:config:setup"];
    astroBuildDoneHook = integration.hooks["astro:build:done"];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("resolve plugin name", () => {
    const integration = astroImageProcessor(options);
    expect(integration.name).toBe("astro-image-processor");
  });

  test("register integration and vite plugin", async () => {
    const mockConfig = { someConfig: true };
    const mockUpdateConfig = vi.fn();
    const mockLogger = { log: vi.fn() };

    const mockContext = {
      db: { close: vi.fn() },
    };

    (initProcessor as Mock).mockResolvedValue(mockContext);

    await astroConfigSetupHook({
      config: mockConfig,
      updateConfig: mockUpdateConfig,
      logger: mockLogger,
    });

    expect(initProcessor).toHaveBeenCalledWith({
      options,
      config: mockConfig,
      logger: mockLogger,
    });

    expect(globalThis.imageProcessorContext).toBe(mockContext);
    expect(mockUpdateConfig).toHaveBeenCalledWith({
      vite: {
        plugins: [
          {
            name: "vite-plugin-astro-image-processor",
            enforce: "pre",
            config: expect.any(Function),
          },
        ],
      },
    });

    // Test the config function inside the vite plugin
    const vitePlugin = mockUpdateConfig.mock.calls[0][0].vite.plugins[0];
    const result = vitePlugin.config({}, {});
    expect(result).toMatchObject({
      optimizeDeps: {
        exclude: [
          "deterministic-object-hash",
          "lokijs",
          "p-limit",
          "sharp",
          "xxhash-addon",
        ],
      },
      ssr: {
        external: true,
      },
    });
  });

  test("build done", () => {
    astroBuildDoneHook();

    expect(pruneCache).toHaveBeenCalled();
  });
});
