---
title: <GlobalStyles />
# description:
---

本インテグレーションの標準コンポーネントが使用する共通CSSを `is:global` を指定した `<style>` 属性で設置するコンポーネント。

通常は以下のように共通のレイアウトに設置してサイト全体に適用する。

```astro ins={3,18}
// src/layout/Layout.astro
---
import { GlobalStyles } from 'astro-image-processor/components';
---

<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Astro Image Processor</title>
  </head>
  <body>
    <h1>Astro Image Processor</h1>
    <slot />
  </body>
</html>

<GlobalStyles />
```

以下の内容が含まれる。

- `<Picture>` コンポーネントのプレースホルダーアニメーション
    - 初期化用のJavaScript
    - JavaScriptが動作しない場合はアニメーションが省略され、プレースホルダーは `<img>` 要素の `background-image` または `background-color` にフォールバックされる
- 各コンポーネントが生成する要素の共通クラス
- 各コンポーネントの `layout` プロパティに対応するクラス

使用するクラス名は[インテグレーション設定の `globalClassNames`](/astro-image-processor/ja/configuration/reference/#globalclassnames) で変更できる。

変更する場合は変更したクラス名等を使用するグローバルCSSを自前で作成して設置する必要がある。
