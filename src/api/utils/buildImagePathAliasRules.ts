import path from 'node:path';

import type { ImagePathAliasRule } from '../../types.js';
import { normalizePath } from './normalizePath.js';

type BuildImagePathAliasRules = (
  aliases: Record<string, string>,
  replaceDirPlaceholders: (pattern: string) => string,
) => ImagePathAliasRule[];

export const buildImagePathAliasRules: BuildImagePathAliasRules = (
  aliases,
  replaceDirPlaceholders,
) => {
  const rules: ImagePathAliasRule[] = [];

  for (const [prefix, pattern] of Object.entries(aliases)) {
    if (!prefix.startsWith('@')) {
      throw new Error(`imagePathAliases key must start with @: ${prefix}`);
    }
    if (!pattern.trim()) {
      throw new Error(`imagePathAliases value must not be empty for ${prefix}`);
    }

    rules.push({
      prefix,
      baseDir: normalizePath(path.resolve(replaceDirPlaceholders(pattern)), true),
    });
  }

  return rules.sort((a, b) => b.prefix.length - a.prefix.length);
};
