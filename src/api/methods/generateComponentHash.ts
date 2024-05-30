import { deterministicString } from "deterministic-object-hash";

import type {
  ImgProcArtDirectiveSourceProps,
  ImgProcHasher,
  ImgProcProcessorOptions,
} from "../../types.js";
import { getFilteredSharpOptions } from "../utils/getFilteredSharpOptions.js";

type GenerateComponentHash = (
  options:
    | (Partial<ImgProcProcessorOptions> & Record<string, unknown>)
    | (Partial<ImgProcArtDirectiveSourceProps> & Record<string, unknown>),
  hasher: ImgProcHasher,
) => string;

export const generateComponentHash: GenerateComponentHash = (
  options,
  hasher,
) => {
  const {
    processor,
    profile,
    blurProcessor,
    artDirectives,
    pictureAttributes,
    ...rest
  } = options;

  return hasher(
    deterministicString({
      ...rest,
      profile: profile
        ? profile
        : processor
          ? [processor]
              .flat()
              .filter(Boolean)
              .map((proc) => getFilteredSharpOptions(proc))
          : undefined,
      blurProfile: blurProcessor
        ? getFilteredSharpOptions(blurProcessor)
        : undefined,
      artDirectives: artDirectives?.map((directive) =>
        generateComponentHash(directive, hasher),
      ),
    }),
  ).slice(0, 8);
};
