---
title: <Image />
# description:
---

`<img>` 要素を生成する標準コンポーネント。

- slotの有無により要素を単独で設置する前景モードとコンテナ要素に内包する背景モードを自動で切り替える
- `<img>` 要素の `sizes` 属性と `srcset` 属性を使用したアートディレクションに対応
- プレースホルダーは `<img>` 要素の `background-image` ないし `background-color` を使用する
    - アニメーションには非対応

## 前景モード

```astro
// src/pages/index.astro
---
import Image from 'astro-image-processor/components';
---

<Image src="/src/assets/images/image.png" alt="Alt text" />
```

## 背景モード

```astro
// src/pages/index.astro
---
import Image from 'astro-image-processor/components';
---

<Image src="/src/assets/images/image.png" alt="Alt text">
  <p>slot</p>
</Image>
```

## プロパティ

### `src`

使用する画像の指定

- 型: `string`
- 必須
- リモートファイル
    - 内容が `http` から始まる場合はリモートファイルと見なす
- Data URL
    - 内容が `data:` から始まる場合はデータURLと見なす
- ローカルファイル
    - 内容が `/@fs` から始まる場合は `/@fs/` を `file://` に置換した上で `new URL(src).pathname` を取得して処理する
    - 内容が `/${assetsDirName}/` から始まる場合は `outDir` からのルート相対パスとして処理する
    - それ以外の場合は `rootDir` からのルート相対パスとして処理する
- プロジェクトルート（ `rootDir` ）からのルート相対パス（例 `/src/assets/images/image.png` ）での指定を推奨
    - 画像を `import` して `src={importedImage.src}` の形式で指定することも可能だが、本インテグレーションと `astro:assets` でキャッシュの二重管理が発生するため非推奨

### `alt`

`<img>` 要素の `alt` 属性の値

- 型: `string`
- 必須

### `width`

`<img>` 要素の `width` 属性の値

- 型: `number`
- `densities` を使用する場合、ここで設定した値が `1x` に相当するものとして解釈される
- 設定しない場合、「仕様としては正しいがユーザーの期待に反する動作」を引き起こしやすい点に留意する

### `height`

`<img>` 要素の `height` 属性の値

- 型: `number`

### `densities`

`<img>` 要素の `srcset` 属性で使用する `x` 記述子の指定

- 型: `number[]`
- 例: `[1, 2, 3]`
- `width` が設定されていない場合、画像の原寸を最大倍率のものとして解釈する

### `widths`

`<img>` 要素の `srcset` 属性で使用する `w` 記述子の指定

- 型: `number[]`
- 例: `[1000, 2000, 3000]`

### `sizes`

`<img>` 要素の `sizes` 属性の指定

- 型: `string | (resolvedWidths: number[], resolvedDensities: number[]) => string`
- 参照: [sizes (MDN)](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/sizes)
- `resolvedWidths` は最終的に解決された画像の幅の配列
    - `densities` を使用する場合でも幅が入る

### `placeholder`

プレースホルダーの指定

- 型: `"blurred" | "dominantColor" | null`
- 既定値: `blurred`
- `blurred`
    - `blueProcessor` で指定されたsharpインスタンスで処理した画像を使用する
    - 画像はBase64に変換され、Data URL形式でCSSに直接記述される
    - 既定では「幅20pxに縮小した品質最低のWebP」が使用される
- `dominantColor`
    - 単色を使用する
    - 既定ではsharpの `stats().dominant` で得られる色を使用する
    - `placeholderColor` プロパティが設定されている場合は `placeholderColor` プロパティで指定した色を使用する

### `placeholderColor`

`placeholder` が `dominantColor` の場合に使用する色の指定

- 型: `string`
- 例: `"#333"` `"hsl(150 30% 60%)"` `"var(--some-color)"`
- この項目を設定しない場合、sharpの `stats().dominant` が使用される
- 参照: [color (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/color_value)

### `blurProcessor`

プレースホルダー（ぼかし画像）の生成に使用するsharpインスタンス

- 型: `Sharp`
- 既定値: `sharp().resize(20).webp({ quality: 1 })`

### `upscale`

`densities` `widths` の指定により画像の拡大が必要な場合の処理方法の指定

- 型: `"never" | "always" | "original"`
- 既定値: `never`
- `never` : 拡大される指定は無視する
- `always` : 拡大される場合は拡大する
- `original` : 拡大される指定を無視した上で、画像の原寸を追加する

### `layout`

画像の水平方向のレイアウトを指定する

- 型: `"constrained" | "fixed" | "fullWidth" | "fill" | null`
- 既定値: `constrained`
- `constrained`: `width: 100%; max-width: ${resolvedWidth};` を指定する
- `fixed`: `width: ${resolvedWidth};` を指定する
- `fullWidth`: `width: 100%;` を指定する
- `<img>` 要素に指定する
- 背景モードではコンテナ要素に指定する
    - `constrained` または `fixed` の場合、`<img>` 要素から `width` プロパティを継承する
- アスペクト比を固定したい場合は `enforceAspectRatio` と併用する

### `objectFit`

`<img>` 要素のCSSプロパティ `object-fit` の値

- 型: `"fill" | "contain" | "cover" | "none" | "scale-down"`
- `globalClassNames.objectFit[objectFit]` のグローバルクラスを `<img>` 要素に適用することで反映する

### `objectPosition`

`<img>` 要素のCSSプロパティ `object-position` の値

- 型: `string`
- スコープ付きCSSによって反映する

### `enforceAspectRatio`

`<img>` 要素にCSSプロパティ `aspect-ratio` を設定する

- 型: `boolean`
- 既定値: false
- CSSプロパティ `aspect-ratio` に最終的な `<img>` 要素の `width` および `height` の値を元に `${width} / ${heigt}` を設定する
- スコープ付きCSSによって反映する

### `asBackground`

背景モードを強制する

- 型: `boolean`
- 既定値: false
- コンポーネントにスロットが存在する場合は必ず背景モードになるため指定不要

### `preload`

指定したフォーマットの画像の `<link rel="preload">` を生成して `<head>` 要素に追加する

- 型: `"jpeg" | "png" | "avif" | "webp" | "gif"`
- CSSの仕様上の制約から複数のフォーマットは指定できない

### `processor`

画像の編集に使用するsharpインスタンス

- 型: `Sharp | Sharp[]`

### `profile`

画像の編集内容に文字列で個別の識別名を与える

- 型: `string`

### `format`

出力フォーマットの指定

- 型: `"jpeg" | "png" | "avif" | "webp" | "gif"`
- 既定値: `webp`

### `formatOptions`

出力フォーマットの設定

- 型: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- 既定値: sharp標準設定

### `tagName`

背景モード時のコンテナ要素のHTMLタグ

- 型: `HTMLTag` (Astro)
- 既定値: `div`
- この値による型の自動補完は行われない

### `containerAttributes`

- 型: `HTMLAttributes<"div"> | HTMLAttributes<"a"> | Record<string, unknown>`
- 背景モードでのみ有効
- コンテナ要素にそのまま渡される

### `minAge`

リモートファイルの最小キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする

### `maxAge`

リモートファイルの最大キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする

### `crossOrigin`

`<img>` 要素の `crossorigin` と同等

- 型: `"anonymous" | "use-credentials" | "" | undefined | null`
- 参照: [crossorigin (MDN)](https://developer.mozilla.org/ja/docs/Web/HTML/Attributes/crossorigin)
- コンポーネントに `crossorigin` プロパティが存在する場合はそちらが優先される

### その他

- 本インテグレーションと無関係のプロパティは全て `<img>` 要素に渡される
    - Astro特有のものを含め `HTMLAttributes<"img">` として受け入れる
- Astroのスコープされたスタイルが生成するdata属性 `data-astro-cid-[hash]` ないしクラス `.astro-[hash]` は `<img>` 要素に継承される
    - 背景モードではコンテナ要素にも継承される
