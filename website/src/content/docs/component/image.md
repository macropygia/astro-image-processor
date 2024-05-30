---
title: <Image />
# description:
---

A standard component that generates a `<img>` element.

- Automatically switches between foreground mode, where elements are placed independently, and background mode, where elements are contained within a container element, based on the presence of a slot.
- Supports art direction using the `sizes` attribute and `srcset` attribute of the `<img>` element.
- Placeholder uses the `background-image` or `background-color` of the `<img>` element.
    - Does not support animations.
- `<StaticImage>` available as alias.

## Foreground mode

```astro
// src/pages/index.astro
---
import Image from 'astro-image-processor/components';
---

<Image src="/src/assets/images/image.png" alt="Alt text" />
```

## Background mode

```astro
// src/pages/index.astro
---
import Image from 'astro-image-processor/components';
---

<Image src="/src/assets/images/image.png" alt="Alt text">
  <p>slot</p>
</Image>
```

## Properties

### `src`

Specifies the image to use

- Type: `string`
- Required
- Remote file
    - Considered a remote file if it starts with `http`.
- Data URL
    - Considered a Data URL if it starts with `data:`.
- Local file
    - If it starts with `/@fs`, replace `/@fs/` with `file://` and process the `new URL(src).pathname`.
    - If it starts with `/${assetsDirName}/`, treat it as a root-relative path from `outDir`.
    - Otherwise, treat it as a root-relative path from `rootDir`.
- Recommended to specify as a root-relative path from the project root (`rootDir`) (e.g., `/src/assets/images/image.png`).
    - You can also specify it in the form of imported image with `src={importedImage.src}`, but this is not recommended due to double caching with this integration and `astro:assets`.

### `alt`

The value of the `alt` attribute of the `<img>` element.

- Type: `string`
- Required

### `width`

The value of the `width` attribute of the `<img>` element.

- Type: `number`
- When using `densities`, the value is interpreted as corresponding to `1x`.
- Note that not setting this can lead to "behavior that is technically correct but contrary to user expectations".

### `height`

The value of the `height` attribute of the `<img>` element.

- Type: `number`

### `densities`

Specifies `x` descriptors used in the `srcset` attribute of the `<img>` element.

- Type: `[number, ...number[]]`
- Example: `[1, 2, 3]`
- If `width` is not set, the original size of the image is interpreted as the maximum scale.

### `widths`

Specifies `w` descriptors used in the `srcset` attribute of the `<img>` element.

- Type: `[number, ...number[]]`
- Example: `[1000, 2000, 3000]`

### `sizes`

Specifies the `sizes` attribute of the `<img>` element.

- Type: `string | (resolvedWidths: number[], resolvedDensities: number[]) => string`
- Reference: [sizes (MDN)](https://developer.mozilla.org/en/docs/Web/API/HTMLImageElement/sizes)
- `resolvedWidths` will be the final resolved variations of image widths.
    - Even if `densities` is used, it will be the width value.

### `placeholder`

Specifies the placeholder.

- Type: `"blurred" | "dominantColor" | null`
- Default: `blurred`
- `blurred`
    - Uses the image processed by the sharp instance specified in `blurProcessor`.
    - The image is converted to Base64 and directly written in CSS as a Data URL.
    - By default, "resized to 20px width and compressed with the lowest quality WebP" is used.
- `dominantColor`
    - Uses a single color.
    - By default, uses the color obtained from sharp's `stats().dominant`.
    - If the `placeholderColor` property is set, uses the color specified by the `placeholderColor` property.

### `placeholderColor`

Specifies the color to use when `placeholder` is `dominantColor`.

- Type: `string`
- Example: `"#333"`, `"hsl(150, 30%, 60%)"`, `"var(--some-color)"`
- If this is not set, `sharp().stats().dominant` is used.
- Reference: [color (MDN)](https://developer.mozilla.org/en/docs/Web/CSS/color_value)

### `blurProcessor`

Sharp instance used to generate the blurred placeholder image.

- Type: `Sharp`
- Default: `sharp().resize(20).webp({ quality: 1 })`

### `upscale`

Specifies how to handle image upscaling required by `densities` or `widths`.

- Type: `"never" | "always" | "original"`
- Default: `never`
- `never`: Ignore upscaling requests.
- `always`: Upscale if required.
- `original`: Ignore upscaling requests and add the original size of the image.

### `layout`

Specifies the horizontal layout of the image.

- Type: `"constrained" | "fixed" | "fullWidth" | "fill" | null`
- Default: `constrained`
- `constrained`: Set CSS as `width: 100%; max-width: ${resolvedWidth};`.
- `fixed`: Set CSS as `width: ${resolvedWidth};`.
- `fullWidth`: Set CSS as `width: 100%;`.
- In the `<Image>` and `<Picture>` components, set to the `<img>` element.
- If the component has a container element, set to the container element.
    - If set to `constrained` or `fixed`, inherit CSS property `width` from the `<img>` element as scoped style.
- Use with `enforceAspectRatio` if you want to fix the aspect ratio.

### `objectFit`

Value of the CSS property `object-fit` for the `<img>` element.

- Type: `"fill" | "contain" | "cover" | "none" | "scale-down"`
- Apply by adding the global class `globalClassNames.objectFit[objectFit]` to the `<img>` element.

### `objectPosition`

Value of the CSS property `object-position` for the `<img>` element.

- Type: `string`
- Apply through scoped CSS.

### `enforceAspectRatio`

Sets the CSS property `aspect-ratio` on `<picture>` and `<img>` elements.

- Type: `boolean`
- Default: `false`
- Sets the CSS property `aspect-ratio` to `${width} / ${height}` based on the final resolved `width` and `height` values of the `<img>` element.
- Apply through scoped CSS.

### `asBackground`

Enforce background mode.

- Type: `boolean`
- Default: `false`
- If a slot exists in the component, it will always be in background mode.

### `preload`

Generates a `<link rel="preload">` for the specified image format and adds it to the `<head>` element.

- Type: `"jpeg" | "png" | "avif" | "webp" | "gif"`
- Due to CSS specifications, multiple formats cannot be specified.

### `processor`

Sharp instance used for image editing.

- Type: `Sharp | Sharp[]`

### `profile`

Assigns an individual identifier name as a string for the image editing content.

- Type: `string`

### `format`

Specifies the output format.

- Type: `"jpeg" | "png" | "avif" | "webp" | "gif"`
- Default: `webp`

### `formatOptions`

Settings for the output formats.

- Type: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- Default: sharp standard settings

### `tagName`

HTML tag of the container element in background mode.

- Type: `HTMLTag` (Astro)
- Default: `div`
- Automatic type completion is not provided by this value.

### `containerAttributes`

- Type: `HTMLAttributes<"div"> | HTMLAttributes<"a"> | Record<string, unknown>`
- Only effective in background mode.
- Passed directly to the container element.

### `minAge`

Minimum cache duration for remote files (milliseconds).

- Type: `number`
- Overrides the specification in HTTP headers.

### `maxAge`

Maximum cache duration for remote files (milliseconds).

- Type: `number`
- Overrides the specification in HTTP headers.

### `crossOrigin`

Equivalent to `crossorigin` of the `<img>` element.

- Type: `"anonymous" | "use-credentials" | "" | undefined | null`
- Reference: [crossorigin (MDN)](https://developer.mozilla.org/en/docs/Web/HTML/Attributes/crossorigin)
- If the component has a `crossorigin` property, it takes precedence.

### Others

- All properties unrelated to this integration will be passed to the `<img>` element.
    - Accepted as `HTMLAttributes<"img">`, including those specific to Astro.
- Data attributes `data-astro-cid-[hash]` or class `.astro-[hash]` generated by Astro's scoped styles will be inherited by the `<picture>` and `<img>` elements.
    - In background mode, they will also be inherited by the container element.
