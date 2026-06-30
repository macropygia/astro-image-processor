import { describe, expect, test } from 'vitest';

import { mockContext } from '#mock/mock.js';

import { defaultOptions } from '../const.js';
import type { ImgProcContext } from '../types.js';
import { ImageSource } from './ImageSource.js';

const createCtx = (componentProps: Partial<ImgProcContext['componentProps']>): ImgProcContext => ({
  ...mockContext,
  settings: {
    ...mockContext.settings,
    hasher: (value: string) => `hash-${value.length}`,
  },
  componentProps: {
    ...defaultOptions.componentProps,
    ...componentProps,
  },
});

describe('Unit/api/placeholderResolution', () => {
  test('ImageSource inherits placeholder from ctx.componentProps', () => {
    const source = ImageSource.buildImage({
      ctx: createCtx({ placeholder: 'dominantColor' }),
      options: { src: '/path/to/image.jpg' },
    });

    expect(source.options.placeholder).toBe('dominantColor');
  });

  test('cssObj applies dominantColor from ctx.componentProps', () => {
    const source = ImageSource.buildImage({
      ctx: createCtx({ placeholder: 'dominantColor' }),
      options: { src: '/path/to/image.jpg', objectFit: 'cover' },
    });
    source.data = { r: 0, g: 255, b: 0 };
    source.resolved = { width: 800, height: 600 };

    expect(source.cssObj).toEqual({
      selectors: {
        'img[scope]': [
          ['background-color', 'rgb(0 255 0)'],
          ['object-fit', 'cover'],
        ],
      },
    });
  });

  test('cssObj omits placeholder styles when default is null', () => {
    const source = ImageSource.buildImage({
      ctx: createCtx({}),
      options: { src: '/path/to/image.jpg', objectFit: 'cover' },
    });
    source.data = { r: 0, g: 255, b: 0 };
    source.resolved = { width: 800, height: 600 };

    expect(source.cssObj).toEqual({
      selectors: {
        'img[scope]': [['object-fit', 'cover']],
      },
    });
  });
});
