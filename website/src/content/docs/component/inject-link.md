---
title: <InjectLink />
# description:
---

`<InjectLink>` component injects `<link>` element(s) into the `<head>` element.

In production builds, links are injected into `<head>` via middleware registered by `astroImageProcessor()` integration. In the dev server, preload links are omitted because they are performance hints only and do not affect preview.

```astro
---
import { injectLink } from "astro-image-processor/injectLink";
import type { HTMLAttributes } from "astro/types";

const linkAttributes: HTMLAttributes<"link"> | HTMLAttributes<"link">[] = {
  rel: "preload",
  as: "image",
  type: "image/webp",
  imagesrcset: "/path/to/image.webp 1x, /path/to/image_2x.webp 2x",
};

const InjectLink = await injectLink(linkAttributes, Astro.locals);
---

<InjectLink />
```

```html
<head>
    <link
        rel="preload"
        as="image"
        type="image/webp"
        imagesrcset="/path/to/image.webp 1x, /path/to/image_2x.webp 2x"
    />
</head>
```
