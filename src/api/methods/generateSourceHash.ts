import type { BaseSource } from "../BaseSource.js";

type GenerateSourceHash = (source: BaseSource) => Promise<string>;

/** Generate hash from src or buffer */
export const generateSourceHash: GenerateSourceHash = async (source) => {
  const { src } = source.options;
  const { useSrcForHash, hasher } = source.settings;

  if (source.type === "remote" || (source.type === "local" && useSrcForHash)) {
    // From `src`
    return hasher(src);
  }
  // From buffer
  const buffer = await source.getBuffer();
  return hasher(buffer);
};
