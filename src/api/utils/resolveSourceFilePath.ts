import path from 'node:path';

import type { ImgProcContextDirectories } from '../../types.js';
import { normalizePath } from './normalizePath.js';
import { resolveAliasedSourcePath } from './resolveAliasedSourcePath.js';
import { resolveLocalSourcePath } from './resolveLocalSourcePath.js';

type ResolveSourceFilePath = (args: { dirs: ImgProcContextDirectories; src: string }) => string;

/** Resolve local image `src` to an absolute filesystem path */
export const resolveSourceFilePath: ResolveSourceFilePath = ({ dirs, src }) => {
  if (src.startsWith('@')) {
    return resolveAliasedSourcePath({ src, rules: dirs.imagePathAliasRules });
  }

  if (src.startsWith(`/${dirs.assetsDirName}/`)) {
    return normalizePath(path.join(dirs.outDir, src));
  }

  return resolveLocalSourcePath({ dirs, src });
};
