---
title: Configuration Reference
# description:
---

全ての設定項目は任意。

型: [ImgProcUserOptions](/astro-image-processor/ja/api/types/interfaces/imgprocuseroptions/)

## インテグレーション設定

### `imageCacheDirPattern`

画像キャッシュディレクトリ（パターン）

- 型: `string`
- 既定値: `[cacheDir]astro-image-processor/`
- 以下のプレースホルダーが使用可能:
    - `[root]`: Astroの `root` に置換される
    - `[cacheDir]`: Astroの `cacheDir` に置換される

### `downloadDirPattern`

リモートファイルのダウンロードディレクトリ（パターン）

- 型: `string`
- 既定値: `[imageCacheDir]downloads/`
- 以下のプレースホルダーが使用可能:
    - `[root]`: Astroの `root` に置換される
    - `[cacheDir]`: Astroの `cacheDir` に置換される
    - `[imageCacheDir]`: `imageCacheDir` の値に置換される

### `imageAssetsDirPattern`

画像アセットディレクトリ（パターン）

- 型: `string`
- 既定値: `/[assetsDirName]/`
- 以下のプレースホルダーが使用可能:
    - `[assetsDirName]`: Astroのアセットディレクトリに置換される（既定では `_astro` ）
- 既定の設定では画像は `/_astro/[hash].[ext]` に設置される

### `imageOutDirPattern`

画像出力ディレクトリ（パターン）

- 型: `string`
- 既定値: `[outDir]`
- 以下のプレースホルダーが使用可能:
    - `[root]`: Astroの `root` に置換される
    - `[outDir]`: Astroの `outDir` に置換される
- 設定で `disableCopy` が `true` の場合、この項目の値がパスのプリフィックスとして使用される
    - プレースホルダーは使用不能
    - 例えば `disableCopy` を `true` に、この項目を `https://cdn.example.com/assets/` に設定するとHTML出力は `src="https://cdn.example.com/assets/[hash].webp"` のようになる
    - その上で `rsync --update --delete` などで `imageCacheDir` とCDNを同期することで各種リソースの使用を最小化できる

### `preserveDirectories`

ディレクトリ構造を再現する

- 型: `boolean`
- 既定値: `false`
- Astroの `srcDir` をドキュメントルートと仮定したルート相対パスに画像を配置する
- 画像ファイル名は `fileNamePattern` に従って解決される
- 例
    - 画像を `/src/assets/images/foo/bar.png` に配置し、コンポーネントの `src` プロパティに同じ値を設定
    - 画像は `/dist/assets/images/foo/[resolved fileNamePattern]` に出力される
    - `<img>` 要素等の `src` `srcset` 属性には `/assets/images/foo/[resolved fileNamePattern]` が出力される

### `fileNamePattern`

ディレクトリ構造の再現が有効な場合のファイル名出力パターン

- 型: `string`
- 既定値: `[name]_[width]x[height]@[descriptor].[ext]?[hash8]`
- `preserveDirectories` が `true` の場合のみ使用される
- 以下のプレースホルダーが使用可能:
    - `[name]`: 元のファイル名（拡張子を除く）
    - `[hash]`: ファイルのハッシュ
    - `[hash8]`: ファイルのハッシュ（先頭の8文字）
    - `[width]`: 要素としての画像の幅
    - `[height]`: 要素としての画像の高さ
    - `[descriptor]`: `1x` `2x` `1000w` `2000w`
    - `[ext]`: 拡張子
- ファイル名は `[name]` `[width]` `[height]` `[descriptor]` の全てを含んでいるか、または `[hash8]` ないし `[hash]` を含んでいる必要がある
    - この条件を満たさない場合、異なる画像に同じ名前が与えられる可能性がある
- クエリパラメータとハッシュを利用したキャッシュバスティングが可能

### `disableCopy`

キャッシュから出力ディレクトリへのコピーを無効化する

- 型: `boolean`
- 既定値: `false`
- `imageOutDirPattern` の説明を参照

### `useSrcForHash`

ローカル画像ファイルの識別用ハッシュをコンポーネントの `src` プロパティの文字列から取得する

- 型: `boolean`
- 既定値: `false`
- ハッシュ生成時に画像ファイルを読み込む必要がないため高速
    - ただし重複ファイルは検出できなくなる
- ファイル名やファイルの設置ディレクトリが変わると別ファイルとして認識される点に留意する

### `scopedStyleStrategy`

スコープされたスタイルの記述方法

- 型: `"where" | "class" | "attribute"`
- 既定値: Astroの設定を継承
- 参照: [scopedStyleStrategy (Astro Docs)](https://docs.astro.build/en/reference/configuration-reference/#scopedstylestrategy)

### `globalClassNames`

グローバルCSSで使用されるクラス名

- 型: `typeof defaultGlobalClassNames`
- 既定値: [defaultGlobalClassNames](/astro-image-processor/ja/api/index/variables/defaultglobalclassnames/)
    - `<GlobalStyles />` コンポーネントに対応する
- 参照: [&lt;GlobalStyles /&gt;](/astro-image-processor/ja/component/global-styles/)
- 変更する場合は対応するグローバルCSSを用意して設置する必要がある

### `timeoutDuration`

ダウンロードタイムアウト（ミリ秒）

- 型: `number`
- 既定値: `50000` (5秒)
- リモートファイルをダウンロードする際のタイムアウト

### `retentionPeriod`

キャッシュ有効期間（ミリ秒）

- 型: `number | null`
- 既定値: `8640000` (100日)
- 設定した期間内に使用されなかった場合にキャッシュを削除対象とする
- `null` に設定した場合、このポリシーによる削除を無効化する
- `retentionCount` と併用する場合は `AND` 条件で処理される

### `retentionCount`

キャッシュが直近のビルドで連続して使用されなかった場合に削除対象と判断する閾値

- 型: `number | null`
- 既定値: `10`
- 「直近 `n` 回のビルドで連続して使用されなかったキャッシュ」を削除対象とする
    - 個々のキャッシュはそれぞれカウントを保持しており、カウントはビルド時に一律で `-1` される
    - 使用されたキャッシュのカウントはこの項目の値にリセットされる
    - ビルド完了時にカウントが0未満のキャッシュは削除される
- `null` に設定した場合、このポリシーによる削除を無効化する
- `retentionPeriod` と併用する場合は `AND` 条件で処理される

### `hasher`

Bufferおよび文字列用ハッシュ生成器（関数）

- 型: `ImgProcHasher`
- 既定値: `astro-image-processor/extras/cryptoHasher`
- 参照: [Hasher](/astro-image-processor/ja/extras/hasher/)

### `dataAdapter`

キャッシュデータベース用データアダプター（クラス）

- 型: `ImgProcDataAdapter`
- 既定値: `astro-image-processor/extras/JsonFileDataAdapter`
- 参照: [Data Adapter](/astro-image-processor/ja/extras/data-adapter/)

## 既定のコンポーネントプロパティ

コンポーネントのプロパティの既定値を設定する。

詳細は各コンポーネントのリファレンスを参照。

- `componentProps.placeholder`
- `componentProps.placeholderColor`
- `componentProps.blurProcessor`
- `componentProps.upscale`
- `componentProps.layout`
- `componentProps.objectFit`
- `componentProps.objectPosition`
- `componentProps.enforceAspectRatio`
- `componentProps.backgroundSize`
- `componentProps.backgroundPosition`
- `componentProps.preload`
- `componentProps.format`
- `componentProps.formats`
- `componentProps.tagName`
- `componentProps.crossOrigin`
- `componentProps.minAge`
- `componentProps.maxAge`

## 既定のフォーマットオプション

対応する出力フォーマットの既定のオプションを設定する。設定しない場合はsharpの初期設定が使用される。

### `formatOptions.jpeg`

JPEG形式の出力オプション。

- 型: `JpegOptions` (sharp)
- 参照: [jpeg (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#jpeg)

### `formatOptions.png`

PNG形式の出力オプション。

- 型: `PngOptions` (sharp)
- 参照: [png (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#png)

### `formatOptions.webp`

WebP形式の出力オプション。

- 型: `WebpOptions` (sharp)
- 参照: [webp (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#webp)

### `formatOptions.avif`

AVIF形式の出力オプション。

- 型: `AvifOptions` (sharp)
- 参照: [avif (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#avif)

### `formatOptions.gif`

GIF形式の出力オプション。

- 型: `GifOptions` (sharp)
- 参照: [gif (Output options - sharp)](https://sharp.pixelplumbing.com/api-output#gif)
