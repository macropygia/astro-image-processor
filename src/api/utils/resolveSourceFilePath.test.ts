import { describe, expect, test } from 'vitest';

import type { ImgProcContextDirectories } from '../../types.js';
import { resolveSourceFilePath } from './resolveSourceFilePath.js';

describe('Unit/api/utils/resolveSourceFilePath', () => {
  const dirs = {
    assetsDirName: 'assets',
    outDir: '/project/dist/',
    imagePathBaseDir: '/project/',
    imagePathAliasRules: [{ prefix: '@', baseDir: '/project/src/' }],
  } as ImgProcContextDirectories;

  test('resolves @-prefixed src via alias rules', () => {
    expect(resolveSourceFilePath({ dirs, src: '@/foo.png' })).toBe('/project/src/foo.png');
  });

  test('resolves built asset paths via outDir', () => {
    expect(resolveSourceFilePath({ dirs, src: '/assets/foo.png' })).toBe(
      '/project/dist/assets/foo.png',
    );
  });

  test('resolves root-relative src via imagePathBaseDir', () => {
    expect(resolveSourceFilePath({ dirs, src: '/src/foo.png' })).toBe('/project/src/foo.png');
  });
});
