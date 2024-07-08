---
title: Tips
# description:
---

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
  densities: [1, 2, 3]
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
