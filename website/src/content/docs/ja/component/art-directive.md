---
title: Art Directive
# description:
---

`<Picture>` および `<Background>` コンポーネントにおける `artDirectives` プロパティの配列の要素。

親コンポーネントの出力の一部となる `<source>` 要素または `image-set()` 内の要素を生成する。

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

### `width`

`<source>` 要素の `width` 属性の値

- 型: `number`
- `densities` を使用する場合、ここで設定した値が `1x` に相当するものとして解釈される
- 設定しない場合、「仕様としては正しいがユーザーの期待に反する動作」を引き起こしやすい点に留意する

### `height`

`<source>` 要素の `height` 属性の値

- 型: `number`

### `densities`

`<source>` 要素の `srcset` 属性で使用する `x` 記述子の指定

- 型: `number[]`
- 例: `[1, 2, 3]`
- `width` が設定されていない場合、画像の原寸を最大倍率のものとして解釈する

### `widths`

`<source>` 要素の `srcset` 属性で使用する `w` 記述子の指定

- 型: `number[]`
- 例: `[1000, 2000, 3000]`

### `sizes`

`<source>` 要素の `sizes` 属性の指定

- 型: `string | (resolvedWidths: number[], resolvedDensities: number[]) => string`
- 参照: [sizes (MDN)](https://developer.mozilla.org/ja/docs/Web/API/HTMLImageElement/sizes)
- `resolvedWidths` は最終的に解決された画像幅のバリエーションとなる
    - `densities` を使用する場合でも幅が入る

### `media`

`<source>` 要素の `media` 属性の指定

- 型: `string`
- 必須
- [source (MDN)](https://developer.mozilla.org/ja/docs/Web/HTML/Element/source#media)

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

`densities` ないし `widths` の指定により画像の拡大が必要な場合の処理方法の指定

- 型: `"never" | "always" | "original"`
- 既定値: `never`
- `never` : 拡大される指定は無視する
- `always` : 拡大される場合は拡大する
- `original` : 拡大される指定を無視した上で、画像の原寸を追加する

### `objectFit`

`<img>` 要素のCSSプロパティ `object-fit` の値

- 型: `"fill" | "contain" | "cover" | "none" | "scale-down"`
- グローバルクラス `globalClassNames.objectFit[objectFit]` が `<img>` 要素に適用される
- `<GlobalStyles>` コンポーネントにより `object-fit` がこの項目の値に設定される
- グローバルクラスを利用して任意のスタイルを設定することができる

### `objectPosition`

`<img>` 要素のCSSプロパティ `object-position` の値

- 型: `string`
- スコープ付きCSSによって反映する

### `backgroundSize`

プレースホルダー画像のCSSプロパティ `background-size` を設定する

- 型: `"cover" | "contain" | "auto" | string | null`
- 参照: [background-size (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-size)
- `placeholder` が `blurred` の場合に使用される
- `backgroundSize` が設定されておらず `objectFit` が設定されている場合は `objectFit` に準じた値が使用される
- スコープ付きCSSによって反映する

### `backgroundPosition`

プレースホルダー画像のCSSプロパティ `background-position` を設定する

- 型: `string | null`
- 参照: [background-position (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-position)
- `placeholder` が `blurred` の場合に使用される
- `backgroundPosition` が設定されておらず `objectPosition` が設定されている場合は `objectPosition` の値が使用される
- `backgroundPosition` も `objectPosition` も設定されていない場合は `50% 50%` が使用される
    - CSSプロパティ `object-position` の既定値
- スコープ付きCSSによって反映する

### `enforceAspectRatio`

`<picture>` および `<img>` 要素にCSSプロパティ `aspect-ratio` を設定する

- 型: `boolean`
- 既定値: false
- CSSプロパティ `aspect-ratio` に最終的な `<img>` 要素の `width` および `height` の値を元に `${width} / ${heigt}` を設定する
- スコープ付きCSSによって反映する

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

### `formats`

出力フォーマットの指定

- 型: `("jpeg" | "png" | "avif" | "webp" | "gif")[]`
- 既定値: `["avif", "webp"]`

### `formatOptions`

出力フォーマットの設定

- 型: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- 既定値: sharp標準設定

### `minAge`

リモートファイルの最小キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする

### `maxAge`

リモートファイルの最大キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする
