---
title: <InjectLink />
# description:
---

`<head>` 要素内に `<link>` 要素を注入するコンポーネント。

配列で渡した場合は要素の数だけ `<link>` 要素を出力する。

本番ビルドでは `astroImageProcessor()` integration が登録する middleware により `<head>` へ注入される。開発サーバーでは preload は性能最適化のみのため出力しない。

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
