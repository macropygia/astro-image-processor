---
title: <InjectLink />
# description:
---

`<InjectLink>` component injects `<link>` element(s) into the `<head>` element.

```astro
---
import { injectLink } from "astro-image-processor/components";

const linkAttributes: HTMLAttributes<"link"> | HTMLAttributes<"link">[] = {
  rel: "preload",
  as: "image",
  type: "image/webp",
  imagesrcset: "/path/to/image.webp 1x, /path/to/image_2x.webp 2x",
};

const InjectLink = await injectLink(linkAttributes);
---

<InjectLink />
```
