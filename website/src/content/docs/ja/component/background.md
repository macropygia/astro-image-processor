---
title: <Background />
# description:
---

コンテナ要素にCSSの `background-image` を設定する標準コンポーネント。

- アートディレクションには [`image-set()`](https://developer.mozilla.org/ja/docs/Web/CSS/image/image-set) を使用する
- 機能は `<Picture>` コンポーネントとほぼ同等

```astro
// src/pages/index.astro
---
import Background from 'astro-image-processor/components';
---

<Background src="/src/assets/images/image.png">
  <p>slot</p>
</Background>
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

### `width`

1倍に相当する画像の幅

- 型: `number`
- `densities` を使用する場合、ここで設定した値が `1x` に相当するものとして解釈される
- 設定しない場合、「仕様としては正しいがユーザーの期待に反する動作」を引き起こしやすい点に留意する

### `height`

1倍に相当する画像の高さ

- 型: `number`

### `densities`

`<img>` 要素の `srcset` 属性で使用する `x` 記述子の指定

- 型: `number[]`
- 例: `[1, 2, 3]`
- `width` が設定されていない場合、画像の原寸を最大倍率のものとして解釈する

### `placeholder`

プレースホルダーの指定

- 型: `"dominantColor" | null`
- 既定値: `dominantColor`
- `dominantColor`
    - 単色を使用する
    - 既定ではsharpの `stats().dominant` で得られる色を使用する
    - `placeholderColor` プロパティが設定されている場合は `placeholderColor` プロパティで指定した色を使用する
- `<Background>` コンポーネントでは `blurred` は選択不可
- `options.componentProps.placeholder` で既定値を `blurred` に設定している場合は `dominantColor` が使用される

### `placeholderColor`

`placeholder` が `dominantColor` の場合に使用する色の指定

- 型: `string`
- 例: `"#333"` `"hsl(150 30% 60%)"` `"var(--some-color)"`
- この項目を設定しない場合、sharpの `stats().dominant` が使用される
- 参照: [color (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/color_value)

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
- コンテナ要素に指定する
    - `constrained` または `fixed` の場合、`<img>` 要素から `width` プロパティを継承する
- アスペクト比を固定したい場合は `enforceAspectRatio` と併用する

### `enforceAspectRatio`

コンテナ要素にCSSプロパティ `aspect-ratio` を設定する

- 型: `boolean`
- 既定値: false
- CSSプロパティ `aspect-ratio` に最終的な `<img>` 要素の `width` および `height` の値を元に `${width} / ${heigt}` を設定する
- スコープ付きCSSによって反映する

### `backgroundSize`

コンテナ要素にCSSプロパティ `background-size` を設定する

- 型: `"cover" | "contain" | string | null`
- 既定値: `cover`
- 参照: [background-size (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-size)
- スコープ付きCSSによって反映する

### `backgroundPosition`

コンテナ要素にCSSプロパティ `background-position` を設定する

- 型: `string`
- 既定値: `50% 50%`
- 参照: [background-position (MDN)](https://developer.mozilla.org/ja/docs/Web/CSS/background-position)
- スコープ付きCSSによって反映する

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
- 末尾の要素がフォールバックフォーマットとして `<img>` 要素で使用される

### `formatOptions`

出力フォーマットの設定

- 型: `{ jpeg: JpegOptions, png: PngOptions, webp: WebpOptions, avif: AvifOptions, gif: GifOptions }` (sharp)
- 既定値: sharp標準設定

### `tagName`

コンテナ要素のHTMLタグ

- 型: `HTMLTag` (Astro)
- 既定値: `div`
- この値による型の自動補完は行われない

### `artDirectives`

メディアクエリ毎のバリエーションの設定

- 型: `ImgProcArtDirectiveProps[]`
- 参照: [Art Directive](/astro-image-processor/ja/component/art-directive/)
- `image-set()` の要素として出力される

### `minAge`

リモートファイルの最小キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする
- `no-cache` より優先される

### `maxAge`

リモートファイルの最大キャッシュ有効期間（ミリ秒）

- 型 : `number`
- HTTPヘッダーによる指定を上書きする

### `crossOrigin`

`<img>` 要素の `crossorigin` 属性と同等

- 型: `"anonymous" | "use-credentials" | "" | undefined | null`
- 参照: [crossorigin (MDN)](https://developer.mozilla.org/ja/docs/Web/HTML/Attributes/crossorigin)
- コンポーネントに `crossorigin` プロパティが存在する場合はそちらが優先される

### その他

- 本インテグレーションと無関係のプロパティは全てコンテナ要素に渡される
    - Astro特有のものを含め `Record<string, unknown>` として受け入れる
- Astroのスコープされたスタイルが生成するdata属性 `data-astro-cid-[hash]` ないしクラス `.astro-[hash]` はコンテナ要素に継承される
