import { describe, expect, test } from 'vitest';

import { buildImagePathAliasRules } from './buildImagePathAliasRules.js';

describe('Unit/api/utils/buildImagePathAliasRules', () => {
  const replaceDirPlaceholders = (pattern: string) =>
    pattern.replaceAll('[root]', '/project/').replaceAll('[srcDir]', '/project/src/');

  test('builds rules sorted by longest prefix', () => {
    const rules = buildImagePathAliasRules(
      {
        '@': '[srcDir]',
        '@images': '[srcDir]/assets/images',
      },
      replaceDirPlaceholders,
    );

    expect(rules).toEqual([
      { prefix: '@images', baseDir: '/project/src/assets/images/' },
      { prefix: '@', baseDir: '/project/src/' },
    ]);
  });

  test('rejects key without @', () => {
    expect(() => buildImagePathAliasRules({ images: '[srcDir]' }, replaceDirPlaceholders)).toThrow(
      'imagePathAliases key must start with @',
    );
  });

  test('rejects empty value', () => {
    expect(() => buildImagePathAliasRules({ '@': '  ' }, replaceDirPlaceholders)).toThrow(
      'imagePathAliases value must not be empty',
    );
  });
});
