---
title: <Picture />
# description:
---

A standard component that generates a `<picture>` element.

- Automatically switches between foreground mode, where elements are placed independently, and background mode, where elements are contained within a container element, based on the presence of a slot.
- Supports full-spec art direction using `<source>` elements with `type` and `srcset` attributes.
- Placeholder is set with `background-image` or `background-color` on the `::after` pseudo-element of the `<picture>` element.
    - Supports animations using [CSS animations](https://developer.mozilla.org/en/docs/Web/CSS/CSS_animations/Using_CSS_animations).
    - Falls back to the `background-image` or `background-color` of the `<img>` element if JavaScript is disabled.
- Functions correctly even if JavaScript is disabled.

## Foreground mode

```astro
// src/pages/index.astro
---
import Picture from 'astro-image-processor/components';
---

<Picture src="/src/assets/images/image.png" alt="Alt text" />
```

## Background mode

```astro
// src/pages/index.astro
---
import Picture from 'astro-image-processor/components';
---

<Picture src="/src/assets/images/image.png" alt="Alt text">
  <p>slot</p>
</Picture>
```

## Properties

### `src`

Sets the image to use.

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
    - You can also specify it in the form of an imported image with `src={importedImage.src}`, but this is not recommended due to double caching with this integration and `astro:assets`.

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

Sets the `x` descriptors used in the `srcset` attribute of the `<img>` element.

- Type: `number[]`
- Example: `[1, 2, 3]`
- If `width` is not set, the original size of the image is interpreted as the maximum scale.

### `widths`

Sets the `w` descriptors used in the `srcset` attribute of the `<img>` element.

- Type: `number[]`
- Example: `[1000, 2000, 3000]`

### `sizes`

Sets the `sizes` attribute of the `<img>` element.

- Type: `string | (resolvedWidths: number[], resolvedDensities: number[]) => string`
- Default: Sets according to the `layout` as follows:
    - `fixed` : `${resolvedWidth}px`
    - `fill` or `fullWidth` : `100vw`
    - `constrained` or `undefined` : `(min-width: ${resolvedWidth}px) ${resolvedWidth}px, 100vw`
- Reference: [sizes (MDN)](https://developer.mozilla.org/en/docs/Web/API/HTMLImageElement/sizes)
- `resolvedWidths` will be the final resolved variations of image widths.
    - Even if `densities` is used, it will be the width value.
- `resolvedWidth` is the value of the `width` attribute of the `<img>` element.

### `placeholder`

Selects the type of the placeholder.

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

Sets the color to use when `placeholder` is `dominantColor`.

- Type: `string`
- Example: `"#333"`, `"hsl(150, 30%, 60%)"`, `"var(--some-color)"`
- If this is not set, `sharp().stats().dominant` is used.
- Reference: [color (MDN)](https://developer.mozilla.org/en/docs/Web/CSS/color_value)

### `blurProcessor`

Sharp instance used to generate the blurred placeholder image.

- Type: `Sharp`
- Default: `sharp().resize(20).webp({ quality: 1 })`

### `upscale`

Selects how to handle image upscaling required by `densities` or `widths`.

- Type: `"never" | "always" | "original"`
- Default: `never`
- `never`: Ignore upscaling requests.
- `always`: Upscale if required.
- `original`: Ignore upscaling requests and add the original size of the image.

### `layout`

Selects the layout of the image.

- Type: `"constrained" | "fixed" | "fullWidth" | "fill" | null`
- Default: `constrained`
- If set to `constrained` or `fixed`, the CSS property `width` of the `<img>` element is set to the resolved value as scoped style.
- The global class `globalClassNames.layout[layout]` is added to the `<picture>` and `<img>` elements.
- The `<GlobalStyles>` component sets the styles as follows:
    - `constrained`: `max-width: 100%; height: auto;`
    - `fixed`: N/A
    - `fullWidth`: `width: 100%; height: auto;`
    - `fill`: `width: 100%; height: 100%;`
- Styles can also be defined manually instead of `<GlobalStyles>` using the global classes.
- Use with `enforceAspectRatio` if you want to fix the aspect ratio.

### `objectFit`

Selects the CSS property `object-fit` for the `<img>` element.

- Type: `"fill" | "contain" | "cover" | "none" | "scale-down"`
- Apply through scoped CSS.
- If `placeholder` is set to `blurred`, applies to the placeholder using `background-size`.
    - `scale-down` falls back to `contain`.

### `objectPosition`

Selects the CSS property `object-position` for the `<img>` element.

- Type: `string`
- Apply through scoped CSS.
- If `placeholder` is set to `blurred`, applies to the placeholder using `background-position`.

### `backgroundSize`

Selects the CSS property `background-size` for the placeholder.

- Type: `"cover" | "contain" | "auto" | string | null`
- Reference: [background-size (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-size)
- Used if `placeholder` is `blurred`.
- If `backgroundSize` is not set and `objectFit` is set, the value of `objectFit` に準じた値が使用される
- Apply through scoped CSS.

### `backgroundPosition`

Sets the CSS property `background-position` for the placeholder.

- Type: `string | null`
- Reference: [background-position (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-position)
- Used if `placeholder` is `blurred`.
- If `backgroundPosition` is not set and `objectPosition` is set, the value according to `objectFit` is used.
- Both `backgroundPosition` and `objectPosition` are not set, `50% 50%` is used.
    - It is the default value of `object-position`.
- Apply through scoped CSS.

### `enforceAspectRatio`

Applies the CSS property `aspect-ratio` to the `<picture>` and `<img>` elements.

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

### `formats`

Selects the output formats.

- Type: `("jpeg" | "png" | "avif" | "webp" | "gif")[]`
- Default: `["avif", "webp"]`
- The last element is used as the fallback format for the `<img>` element.

### `formatOptions`

Settings for the output formats.

- Type: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- Default: sharp standard settings

### `tagName`

HTML tag of the container element in background mode.

- Type: `HTMLTag` (Astro)
- Default: `div`
- Automatic type completion is not provided by this value.

### `artDirectives`

Settings for variations for each media query.

- Type: `ImgProcArtDirectiveProps[]`
- Reference: [Art Directive](/astro-image-processor/component/art-directive/)
- Outputs a `<source>` element with the `media` attribute specified for each array element.
    - CSS is output with media queries.

### `pictureAttributes`

- Type: `HTMLAttributes<"picture">` (Astro)
- Passed directly to the `<picture>` element.

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
