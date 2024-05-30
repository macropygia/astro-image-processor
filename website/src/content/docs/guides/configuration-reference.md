---
title: Configuration Reference
# description:
---

All configurations are optional.

Type: [ImgProcUserOptions](/astro-image-processor/api/types/interfaces/imgprocuseroptions/)

## Integration Settings

### `imageCacheDirPattern`

Image cache directory pattern.

- Type: `string`
- Default: `[cacheDir]astro-image-processor/`
- The following placeholders can be used:
    - `[root]`: Replaced with Astro's `root`
    - `[cacheDir]`: Replaced with Astro's `cacheDir`

### `downloadDirPattern`

Directory for downloading remote files pattern.

- Type: `string`
- Default: `[imageCacheDir]downloads/`
- The following placeholders can be used:
    - `[root]`: Replaced with Astro's `root`
    - `[cacheDir]`: Replaced with Astro's `cacheDir`
    - `[imageCacheDir]`: Replaced with the value of `imageCacheDir`

### `imageAssetsDirPattern`

Image assets directory pattern.

- Type: `string`
- Default: `/[assetsDirName]/`
- The following placeholders can be used:
    - `[assetsDirName]`: Replaced with Astro's asset directory (default is `_astro`)
- By default, images will be placed at `/_astro/[hash].[ext]`.

### `imageOutDirPattern`

Image output directory pattern.

- Type: `string`
- Default: `[outDir]`
- The following placeholders can be used:
    - `[root]`: Replaced with Astro's `root`
    - `[outDir]`: Replaced with Astro's `outDir`
- If `disableCopy` is set to `true`, the value of this item is used as a prefix for the path:
    - Placeholder is disabled.
    - For example, if `disableCopy` is `true` and this item is set to `https://cdn.example.com/assets/`, the HTML output will be like `src="https://cdn.example.com/assets/[hash].webp"`.
    - Additionally, you can minimize resource usage by synchronizing `imageCacheDir` with the CDN using `rsync --update --delete`, etc.

### `preserveDirectories`

Preserve directory structure for image files.

- Type: `boolean`
- Default: `false`
- Place images by root-relative paths with `srcDir` as the document root.
- Image filenames are resolved according to `fileNamePattern`.
- Example:
    - Place the source file in `/src/assets/images/foo/bar.png` and set the `src` property in the component to the same value.
    - Image output to `/dist/assets/images/foo/[resolved fileNamePattern]`.
    - The `src` and `srcset` of the `<img>` element will contain `/assets/images/foo/[resolved fileNamePattern]`.

### `fileNamePattern`

File name pattern when the preserve directory structure option is enabled.

- Type: `string`
- Default: `[name]_[width]x[height]@[descriptor].[ext]?[hash8]`
- Supports the following placeholders:
    - `[name]`: Original file name (without extension)
    - `[hash]`: File hash (full)
    - `[hash8]`: File hash (first 8 characters)
    - `[width]`: Resolved width
    - `[height]`: Resolved height
    - `[descriptor]`: `1x`, `2x`, `1000w`, `2000w`
    - `[ext]`: Extension
- The file name must include all of `[name]`, `[width]`, `[height]`, and `[descriptor]`, or include `[hash8]` or `[hash]`.
    - If this condition is not met, different images may be given the same name.
- A cache buster can be specified using the hash and query parameter.

### `disableCopy`

Disable copying from the cache to the output directory.

- Type: `boolean`
- Default: `false`
- Refer to the description of `imageOutDirPattern`.

### `useSrcForHash`

Use the string from the component's `src` property to generate a hash for identifying local image files.

- Type: `boolean`
- Default: `false`
- Faster since it doesn't require reading the image file during hash generation.
    - However, duplicate files cannot be detected.
- Note that files will be recognized as different if the file name or directory changes.

### `scopedStyleStrategy`

Specify the strategy used for scoping styles.

- Type: `"where" | "class" | "attribute"`
- Default: Inherits Astro's settings.
- Reference: [scopedStyleStrategy (Astro Docs)](https://docs.astro.build/en/reference/configuration-reference/#scopedstylestrategy)

### `globalClassNames`

Class names used in global CSS.

- Type: `typeof defaultGlobalClassNames`
- Default: [defaultGlobalClassNames](/astro-image-processor/api/index/variables/defaultglobalclassnames/)
    - Corresponds to the `<GlobalStyles />` component.
- Reference: [&lt;GlobalStyles /&gt;](/astro-image-processor/component/global-styles/)
- If changed, need to create and place the corresponding global CSS.

### `timeoutDuration`

Download timeout duration in milliseconds.

- Type: `number`
- Default: `50000` (5 seconds)
- Timeout duration for downloading remote files.

### `retentionPeriod`

Cache retention period in milliseconds.

- Type: `number | null`
- Default: `8640000` (100 days)
- If not used within the set period, the cache will be subject to deletion.
- If set to `null`, deletion by this policy is disabled.
- If both `retentionPeriod` and `retentionCount` are enabled, they are processed under `AND` conditions.

### `retentionCount`

Threshold to determine if the cache should be deleted if not used consecutively in the recent builds.

- Type: `number | null`
- Default: `10`
- Caches that have not been used consecutively in the last `n` builds will be subject to deletion:
    - Each cache keeps its own count, which is decremented by `-1` uniformly during build.
    - The count of used caches is reset to the value of this item.
    - Caches with a count less than 0 at the end of the build are deleted.
- If set to `null`, deletion by this policy is disabled.
- If both `retentionPeriod` and `retentionCount` are enabled, they are processed under `AND` conditions.

### `hasher`

Hash generator for Buffer and strings (function).

- Type: `ImgProcHasher`
- Default: `astro-image-processor/extras/cryptoHasher`
- Reference: [Hasher](/astro-image-processor/extras/hasher/)

### `dataAdapter`

Data adapter for cache database (class).

- Type: `ImgProcDataAdapter`
- Default: `astro-image-processor/extras/JsonFileDataAdapter`
- Reference: [Data Adapter](/astro-image-processor/extras/data-adapter/)

## Default Component Properties

Set the default values for the component properties.

See each component reference for details.

- `componentProps.placeholder`
- `componentProps.placeholderColor`
- `componentProps.blurProcessor`
- `componentProps.upscale`
- `componentProps.layout`
- `componentProps.objectFit`
- `componentProps.objectPosition`
- `componentProps.enforceAspectRatio`
- `componentProps.backgroundSize`
- `componentProps.backgroundPosition`
- `componentProps.preload`
- `componentProps.format`
- `componentProps.formats`
- `componentProps.tagName`
- `componentProps.crossOrigin`
- `componentProps.minAge`
- `componentProps.maxAge`

## Default Format Options

Set the default options for the corresponding output formats. If not set, the default settings of sharp will be used.

### `formatOptions.jpeg`

Output options for JPEG format.

- Type: `JpegOptions` (sharp)
- Reference: [jpeg (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#jpeg)

### `formatOptions.png`

Output options for PNG format.

- Type: `PngOptions` (sharp)
- Reference: [png (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#png)

### `formatOptions.webp`

Output options for WebP format.

- Type: `WebpOptions` (sharp)
- Reference: [webp (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#webp)

### `formatOptions.avif`

Output options for AVIF format.

- Type: `AvifOptions` (sharp)
- Reference: [avif (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#avif)

### `formatOptions.gif`

Output options for GIF format.

- Type: `GifOptions` (sharp)
- Reference: [gif (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#gif)
