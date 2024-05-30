import type { AstroConfig } from "astro";

import { defaultOptions } from "../../const.js";
import type { ImgProcOptions, ImgProcUserOptions } from "../../types.js";

type ResolveOptions = (
  options: ImgProcUserOptions | undefined,
  config: AstroConfig,
) => ImgProcOptions;

export const resolveOptions: ResolveOptions = (options, config) => {
  // User options
  const {
    componentProps: userComponentProps,
    formatOptions: userFormatOptions,
    ...userSettings
  } = options || {};

  // from Astro
  const { scopedStyleStrategy } = config;

  // Default options
  const {
    componentProps: defaultComponentProps,
    formatOptions: defaultFormatOptions,
    ...defaultSettings
  } = defaultOptions;

  // Merge
  const resolvedOptions = {
    componentProps: {
      ...defaultComponentProps,
      ...userComponentProps,
    },
    formatOptions: {
      ...defaultFormatOptions,
      ...userFormatOptions,
    },
    ...defaultSettings,
    scopedStyleStrategy,
    ...userSettings,
  };

  return resolvedOptions;
};
