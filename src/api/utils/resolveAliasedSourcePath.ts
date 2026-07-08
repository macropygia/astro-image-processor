import path from 'node:path';

import type { ImagePathAliasRule } from '../../types.js';
import { normalizePath } from './normalizePath.js';

type ResolveAliasedSourcePath = (args: { src: string; rules: ImagePathAliasRule[] }) => string;

/** `@`-prefixed src → filesystem path via imagePathAliasRules */
export const resolveAliasedSourcePath: ResolveAliasedSourcePath = ({ src, rules }) => {
  if (!src.startsWith('@')) {
    throw new Error('resolveAliasedSourcePath requires @-prefixed src');
  }

  for (const { prefix, baseDir } of rules) {
    if (src === prefix || src.startsWith(`${prefix}/`)) {
      const remainder = src === prefix ? '' : src.slice(prefix.length + 1);
      return normalizePath(path.join(baseDir, remainder));
    }
  }

  throw new Error(`Unknown image path alias in src: ${src}`);
};
