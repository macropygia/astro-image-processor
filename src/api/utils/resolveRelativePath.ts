import path from "node:path";

import type { ImgProcContextDirectories } from "../../types.js";
import { normalizePath } from "./normalizePath.js";

type ResolveRelativePath = (args: {
  dirs: ImgProcContextDirectories;
  /** Astro.url.pathname */
  pathname: string;
  src: string;
}) => string;

/**
 * @experimental
 */
export const resolveRelativePath: ResolveRelativePath = ({
  dirs,
  pathname,
  src,
}) => {
  const { rootDir, srcDir } = dirs;

  const srcDirName = path.relative(rootDir, srcDir);
  const validateSrcRE = new RegExp(`^(data:|https?://|/|${srcDirName}/)`);

  // `data:` `http://` `https://` `/` `src/`
  if (validateSrcRE.test(src)) {
    return src;
  }

  const resolvedSrc = normalizePath(
    `/${path.join(srcDirName, "pages", pathname, src)}`,
  );

  return resolvedSrc;
};
