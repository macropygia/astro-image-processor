---
title: <InjectStyle />
# description:
---

`<head>` 要素内に `<style>` 要素を注入するコンポーネント。

配列で渡した場合は連結して単独の `<style>` 要素に出力する。

```astro
---
import { injectStyle } from "astro-image-processor/components";

const css: string | string[] = ".foo { color: red; }";

const InjectStyle = await injectStyle(css);
---

<InjectStyle />
```

```html
<head>
  <style>.foo { color: red; }</style>
</head>
```
