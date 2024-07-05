# Astro Image Processor

**English** | [日本語](README.ja.md)

[Astro](https://astro.build/) integration for image optimization and art direction for static builds.

**Currently under early development. It will be developed internally for a while.**

**All specifications are subject to change without notice, including those involving breaking changes.**

## Overview

- Outputs the `<img>` and `<picture>` elements as foreground or background
- Sets the `background-image` for the container elements using `image-set()`
- Supports static builds only
    - SSR is not supported and there are no plans to support it
- Depends on [sharp](https://sharp.pixelplumbing.com/)
    - Accepts a sharp instance directly as a property to process images
- Focuses on accelerating processing and reducing duplication
- Includes an independent persistent cache
- Links: [GitHub](https://github.com/macropygia/astro-image-processor) / [npm](https://www.npmjs.com/package/astro-image-processor) / [Documentation](https://macropygia.github.io/astro-image-processor/)

## Documentation

Detailed information can be found in the [official documentation](https://macropygia.github.io/astro-image-processor/).

- List of features and specifications: [Introduction](https://macropygia.github.io/astro-image-processor/)
- [Sample Output](https://macropygia.github.io/astro-image-processor/ja/sample-output/)
- Quick start guide: [Getting Started](https://macropygia.github.io/astro-image-processor/getting-started/)

## Considerations for Production Use

For production use, it is strongly recommended to fix the versions of this integration and sharp.

If these implementations change, the hashes used for image identification may also change. If the hashes change, all caches will need to be rebuilt, and the content of the HTML will be affected as well.

## Contributing

If you are using GitHub Copilot to generate suggested code, you must set the `Suggestions matching public code` option to `Block`. If you are using a similar service with a similar option, you must do the same.
