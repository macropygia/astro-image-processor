---
title: <InjectStyle />
# description:
---

`<InjectStyle>` component injects `<style>` element into the `<head>` element.

In production builds, styles are injected into `<head>` via middleware registered by `astroImageProcessor()` integration. In the dev server, middleware runs but cannot rewrite prerendered HTML responses, so styles are rendered inline at the component output position (not valid HTML, but sufficient for development preview).

```astro
---
import { injectStyle } from "astro-image-processor/injectStyle";

const css: string | string[] = ".foo { color: red; }";

const InjectStyle = injectStyle(css, Astro.locals);
---

<InjectStyle />
```

```html
<head>
    <style>
        .foo {
            color: red;
        }
    </style>
</head>
```
