import { describe, expect, test } from 'vitest';

import {
  resolveDominantPlaceholderColor,
  shouldGenerateBlurredPlaceholder,
  usesBlurredPlaceholderCss,
  usesDominantColorPlaceholderCss,
} from './resolveProvisionalPlaceholder.js';

describe('resolveProvisionalPlaceholder', () => {
  test('skips blurred generation in development', () => {
    const currentMode = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    expect(shouldGenerateBlurredPlaceholder('blurred')).toBe(false);
    expect(shouldGenerateBlurredPlaceholder('dominantColor')).toBe(false);

    import.meta.env.MODE = 'production';
    expect(shouldGenerateBlurredPlaceholder('blurred')).toBe(true);

    import.meta.env.MODE = currentMode;
  });

  test('enables dominantColor CSS in development', () => {
    const currentMode = import.meta.env.MODE;
    import.meta.env.MODE = 'development';

    expect(usesDominantColorPlaceholderCss('dominantColor')).toBe(true);
    expect(usesBlurredPlaceholderCss('blurred')).toBe(false);
    expect(resolveDominantPlaceholderColor('blurred', undefined, { r: 1, g: 2, b: 3 })).toBe(
      'rgb(1 2 3)',
    );

    import.meta.env.MODE = currentMode;
  });
});
