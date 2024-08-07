---
title: <Background />
# description:
---

Standard component that sets the CSS property `background-image` for container elements.

- Use [`image-set()`](https://developer.mozilla.org/en/docs/Web/CSS/image/image-set) for art direction.
- Functionality is almost the same as the `<Picture>` component.

```astro
// src/pages/index.astro
---
import Background from 'astro-image-processor/components';
---

<Background src="/src/assets/images/image.png">
  <p>slot</p>
</Background>
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

### `width`

Width equivalent to 1x.

- Type: `number`
- When using `densities`, the value is interpreted as corresponding to `1x`.
- Note that not setting this can lead to "behavior that is technically correct but contrary to user expectations".

### `height`

Height equivalent to 1x.

- Type: `number`

### `densities`

Sets the `x` descriptors used in the `image-set()`.

- Type: `number[]`
- Example: `[1, 2, 3]`
- If `width` is not set, the original size of the image is interpreted as the maximum scale

### `placeholder`

Selects the type of the placeholder.

- Type: `"dominantColor" | null`
- Default: `dominantColor`
- `dominantColor`
    - Uses a single color.
    - By default, uses the color obtained from sharp's `stats().dominant`.
    - If the `placeholderColor` property is set, uses the color specified by the `placeholderColor` property.
- `blurred` is unavailable in the `<Background>` component
- If the default value is set to `blurred` in `options.componentProps.placeholder`, use `dominantColor` instead

### `placeholderColor`

Sets the color to use when `placeholder` is `dominantColor`.

- Type: `string`
- Example: `"#333"`, `"hsl(150, 30%, 60%)"`, `"var(--some-color)"`
- If this is not set, `sharp().stats().dominant` is used.
- Reference: [color (MDN)](https://developer.mozilla.org/en/docs/Web/CSS/color_value)

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

### `backgroundSize`

Selects the CSS property `object-position` for the container element.

- Type: `"cover" | "contain" | "auto" | string | null`
- Reference: [background-size (MDN)](https://developer.mozilla.org/en/docs/Web/CSS/background-size)
- Apply through scoped CSS.

### `backgroundPosition`

Selects the CSS property `background-size` for the container element.

- Type: `string | null`
- Reference: [background-position (MDN)](https://developer.mozilla.org/en/docs/Web/CSS/background-position)
- Apply through scoped CSS.

### `enforceAspectRatio`

Applies the CSS property `aspect-ratio` to the `<picture>` and `<img>` elements.

- Type: `boolean`
- Default: `false`
- Sets the CSS property `aspect-ratio` to `${width} / ${height}` based on the final resolved `width` and `height` values of the `<img>` element.
- Apply through scoped CSS.

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
- The last element is used as the fallback format.

### `formatOptions`

Settings for the output formats.

- Type: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- Default: sharp standard settings

### `tagName`

HTML tag of the container element.

- Type: `HTMLTag` (Astro)
- Default: `div`
- Automatic type completion is not provided by this value.

### `artDirectives`

Settings for variations for each media query.

- Type: `ImgProcArtDirectiveProps[]`
- Reference: [Art Directive](/astro-image-processor/component/art-directive/)
- Outputs a `image-set()` element specified for each array element.

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

- All properties unrelated to this integration will be passed to the container element.
    - Accepted as `Record<string, unknown>`, including those specific to Astro.
- Data attributes `data-astro-cid-[hash]` or class `.astro-[hash]` generated by Astro's scoped styles will be inherited by the container element.
