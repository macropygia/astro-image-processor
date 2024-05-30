---
title: Custom Component
# description:
---

For use cases that cannot be handled by standard components, you can create custom components.

The implementation of standard components is self-contained within each component's `.astro` file, and you can trace all the APIs used from the imports.

- `<Image>` component
    - `astro-image-processor/components/Image.astro`
- `<Picture>` component
    - `astro-image-processor/components/Picture.astro`
- `<Background>` component
    - `astro-image-processor/components/Background.astro`

## Example

As an example, consider the case of changing the CSS output by the `<Image>` component.

Define `CustomImageSource` class that extends the `ImageSource` class and overrides the `cssObj` method to change the CSS output.

```ts
// CustomImageSource.ts
import { ImageSource } from "astro-image-processor/api/ImageSource.js";

export class CustomImageSource extends ImageSource {
  public override get cssObj(): ImgProcCssObj | undefined {
    // ...
  }
}
```

Duplicate `Image.astro` and create a `CustomImage` component that uses the `CustomImageSource` class instead of the `ImageSource` class.

```astro {3,14}
---
// CustomImage.astro
import { CustomImageSource } from "path/to/CustomImageSource.js";

// ...

const {
  imageAttributes,
  imageClassList,
  containerClassList,
  containerAttributes,
  css,
  link,
} = await CustomImageSource.factory({
  ctx: globalThis.imageProcessorContext,
  asBackground,
  options,
});
---

```

Use the `CustomImage` component instead of the `Image` component.

```astro ins={4,9} del={3,8}
// src/pages/index.astro
---
import { Image } from 'astro-image-processor/components/CustomImage.astro';
import { CustomImage } from '../path/to/CustomImage.astro';
---

<Layout>
  <Image src="path/to/image.png" alt="Sample image" />
  <CustomImage src="path/to/image.png" alt="Sample image" />
</Layout>
```
