---
title: Tips
# description:
---

## Development server behavior

During `astro dev`, components return HTML immediately without waiting for all variant compression to finish:

- **Cache hit**: Final optimized markup (same as build).
- **Cache miss**: Provisional markup using `devPlaceholder` (default: original `src`), while compression runs in the background via Piscina.

Relevant integration options:

```ts
astroImageProcessor({
    devConcurrency: 3, // Piscina maxThreads in dev (default: 3)
    devReloadOnCompressComplete: false, // full-reload after background compression (default: false)
    componentProps: {
        devPlaceholder: 'source', // provisional src in dev (default: 'source')
    },
});
```

- With `devReloadOnCompressComplete: false`, reload the page manually after `[aip] Dev compression complete` appears in the log.
- `<link rel="preload">` is not emitted in dev (`injectLink` is a no-op). Styles are inlined in the body for preview; see [&lt;InjectStyle /&gt;](/astro-image-processor/component/inject-style/).

## Apply multiple properties together

```typescript
// templates.ts
import type { ImgProcPictureComponentProps } from 'astro-image-processor/types';

export const templateObject: Pick<
    ImgProcPictureComponentProps,
    'formats' | 'placeholder' | 'layout' | 'densities'
> = {
    formats: ['avif', 'webp', 'png'],
    placeholder: 'dominantColor',
    layout: 'fullWidth',
    densities: [1, 2, 3],
};
```

```jsx
// foo.astro
---
import Picture from 'astro-image-processor/components/Picture.astro';
import { templateObject } from 'path/to/templates';
---

<Picture
  src='/src/assets/images/foo.png'
  alt='Alt text'
  width={1000}
  height={500}
  {...templateObject}
/>
```
