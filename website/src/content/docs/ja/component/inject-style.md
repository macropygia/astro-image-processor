---
title: <InjectStyle />
# description:
---

`<head>` 要素内に `<style>` 要素を注入するコンポーネント。

配列で渡した場合は連結して単独の `<style>` 要素に出力する。

本番ビルドでは `astroImageProcessor()` integration が登録する middleware により `<head>` へ注入される。開発サーバーでは middleware は動作するが prerender ルートの HTML レスポンスは書き換えられないため、コンポーネントの出力位置に `<style>` をその場出力する（HTML としては非準拠だが、開発時のプレビュー用途では問題ない）。

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
