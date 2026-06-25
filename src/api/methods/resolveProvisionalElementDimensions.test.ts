// @ts-nocheck
import { describe, expect, test } from 'vitest';

import type { BaseSource } from '../BaseSource.js';
import { resolveProvisionalElementDimensions } from './resolveProvisionalElementDimensions.js';

describe('Unit/api/methods/resolveProvisionalElementDimensions', () => {
  const baseSource = {
    data: { width: 1024, height: 768 },
    options: {
      src: '/path/to/image.jpg',
      width: 1024,
      height: 768,
    },
    resolved: { widths: [1024], densities: [1] },
  } as unknown as BaseSource;

  test.each<{ source: BaseSource; result: { width: number; height: number } }>([
    {
      source: { ...baseSource } as unknown as BaseSource,
      result: { width: 1024, height: 768 },
    },
    {
      source: {
        ...baseSource,
        options: { src: '/path/to/image.jpg', width: 512 },
      } as unknown as BaseSource,
      result: { width: 512, height: 384 },
    },
    {
      source: {
        ...baseSource,
        options: { src: '/path/to/image.jpg', height: 500 },
      } as unknown as BaseSource,
      result: { width: 667, height: 500 },
    },
    {
      source: {
        ...baseSource,
        options: { src: '/path/to/image.jpg' },
      } as unknown as BaseSource,
      result: { width: 1024, height: 768 },
    },
  ])('resolves from source metadata', ({ source, result }) => {
    resolveProvisionalElementDimensions(source);
    expect(source.resolved).toMatchObject(result);
  });

  test('throws without source dimensions', () => {
    expect(() =>
      resolveProvisionalElementDimensions({
        options: { src: '/path/to/image.jpg' },
        data: {},
        resolved: {},
      } as unknown as BaseSource),
    ).toThrowError('Invalid source demiensions: /path/to/image.jpg');
  });
});
