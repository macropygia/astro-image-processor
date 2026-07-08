import { describe, expect, test } from 'vitest';

import type { ImagePathAliasRule } from '../../types.js';
import { resolveAliasedSourcePath } from './resolveAliasedSourcePath.js';

describe('Unit/api/utils/resolveAliasedSourcePath', () => {
  const rules: ImagePathAliasRule[] = [
    { prefix: '@images', baseDir: '/project/src/assets/images/' },
    { prefix: '@', baseDir: '/project/src/' },
  ];

  test.each([
    { src: '@/assets/foo.png', expected: '/project/src/assets/foo.png' },
    { src: '@images/foo.png', expected: '/project/src/assets/images/foo.png' },
  ])('resolves $src', ({ src, expected }) => {
    expect(resolveAliasedSourcePath({ src, rules })).toBe(expected);
  });

  test('throws for unknown alias', () => {
    expect(() => resolveAliasedSourcePath({ src: '@unknown/foo.png', rules })).toThrow(
      'Unknown image path alias in src',
    );
  });

  test('throws when rules are empty', () => {
    expect(() => resolveAliasedSourcePath({ src: '@/foo.png', rules: [] })).toThrow(
      'Unknown image path alias in src',
    );
  });
});
