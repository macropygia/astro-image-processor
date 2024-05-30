---
title: <InjectLink />
# description:
---

`<head>` 要素内に `<link>` 要素を注入するコンポーネント。

配列で渡した場合は要素の数だけ `<link>` 要素を出力する。

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

```html
<head>
  <link
    rel="preload"
    as="image"
    type="image/webp"
    imagesrcset="/path/to/image.webp 1x, /path/to/image_2x.webp 2x">
</head>
```
