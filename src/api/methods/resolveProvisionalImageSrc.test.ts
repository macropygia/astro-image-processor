import { describe, expect, test } from 'vitest';

import { transparentPixelSrc } from '../../const.js';
import { resolveProvisionalImageSrc } from './resolveProvisionalImageSrc.js';

describe('resolveProvisionalImageSrc', () => {
  const source = {
    options: { src: '/src/assets/hero.png', devPlaceholder: undefined },
  };

  test('uses transparent pixel by default in development', () => {
    const currentMode = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    expect(resolveProvisionalImageSrc(source as never)).toBe(transparentPixelSrc);

    import.meta.env.MODE = currentMode;
  });

  test('uses original src when devPlaceholder is source', () => {
    const currentMode = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    expect(
      resolveProvisionalImageSrc({
        options: { src: 'https://example.com/hero.jpg', devPlaceholder: 'source' },
      } as never),
    ).toBe('https://example.com/hero.jpg');

    import.meta.env.MODE = currentMode;
  });

  test('uses transparent pixel in production', () => {
    const currentMode = import.meta.env.MODE;
    import.meta.env.MODE = 'production';

    expect(
      resolveProvisionalImageSrc({
        options: { src: '/src/assets/hero.png', devPlaceholder: 'source' },
      } as never),
    ).toBe(transparentPixelSrc);

    import.meta.env.MODE = currentMode;
  });
});
