import { describe, expect, test } from 'vitest';

import type { ImgProcContextDirectories } from '../../types.js';
import { resolveLocalSourcePath } from './resolveLocalSourcePath.js';

describe('Unit/api/utils/resolveLocalSourcePath', () => {
  const dirs = {
    imagePathBaseDir: '/project/',
  } as Pick<ImgProcContextDirectories, 'imagePathBaseDir'>;

  test.each([
    { src: '/src/assets/foo.png', expected: '/project/src/assets/foo.png' },
    { src: 'src/assets/foo.png', expected: '/project/src/assets/foo.png' },
    { src: '/assets/foo.png', expected: '/project/assets/foo.png' },
    { src: 'assets/foo.png', expected: '/project/assets/foo.png' },
  ])('resolves $src from imagePathBaseDir', ({ src, expected }) => {
    expect(resolveLocalSourcePath({ dirs, src })).toBe(expected);
  });

  test('resolves with srcDir as base', () => {
    expect(
      resolveLocalSourcePath({
        dirs: { imagePathBaseDir: '/project/src/' },
        src: '/assets/foo.png',
      }),
    ).toBe('/project/src/assets/foo.png');
  });

  test('normalizes parent segments relative to base', () => {
    expect(
      resolveLocalSourcePath({
        dirs: { imagePathBaseDir: '/project/src/pages/blog/' },
        src: '../assets/foo.png',
      }),
    ).toBe('/project/src/pages/assets/foo.png');
  });
});
