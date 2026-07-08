import path from 'node:path';

import type { ImgProcContextDirectories } from '../../types.js';
import { normalizePath } from './normalizePath.js';

type ResolveLocalSourcePath = (args: {
  dirs: Pick<ImgProcContextDirectories, 'imagePathBaseDir'>;
  src: string;
}) => string;

/** Local relative path → filesystem path under imagePathBaseDir */
export const resolveLocalSourcePath: ResolveLocalSourcePath = ({ dirs, src }) => {
  const relative = src.startsWith('/') ? src.slice(1) : src;
  return normalizePath(path.join(dirs.imagePathBaseDir, relative));
};
