---
title: Custom Component
# description:
---

標準コンポーネントでは対応できないユースケースにはカスタムコンポーネントを作成して対応することができる。

標準コンポーネントの実装は各コンポーネントの `.astro` ファイル内で完結しており、使われているAPIは全てimportから辿ることができる。

- `<Image>` コンポーネント
    - `astro-image-processor/components/Image.astro`
- `<Picture>` コンポーネント
    - `astro-image-processor/components/Picture.astro`
- `<Background>` コンポーネント
    - `astro-image-processor/components/Background.astro`

## 例

例として `<Image>` コンポーネントの出力するCSSの内容を変更するケースを挙げる。

`ImageSource` クラスを継承し、 `cssObj` メソッドをオーバーライドして出力するCSSを変更した `CustomImageSource` クラスを定義する。

```ts
// CustomImageSource.ts
import { ImageSource } from "astro-image-processor/api/ImageSource.js";

export class CustomImageSource extends ImageSource {
  public override get cssObj(): ImgProcCssObj | undefined {
    // ...
  }
}
```

`Image.astro` を複製し、 `ImageSource` クラスの代わりに作成した `CustomImageSource` クラスを使用するように修正した `CustomImage` コンポーネントを作成する。

```astro {3,14}
---
// CustomImage.astro
import { CustomImageSource } from "path/to/CustomImageSource.js";

// ...

const {
  imageAttributes,
  imageClassList,
  containerClassList,
  containerAttributes,
  css,
  link,
} = await CustomImageSource.factory({
  ctx: globalThis.imageProcessorContext,
  asBackground,
  options,
});
---

```

`Image` コンポーネントの代わりに作成した `CustomImage` コンポーネントを使用する。

```astro ins={4,9} del={3,8}
// src/pages/index.astro
---
import Image from 'astro-image-processor/components/Image.astro';
import CustomImage from '../path/to/CustomImage.astro';
---

<Layout>
  <Image src="path/to/image.png" alt="Sample image" />
  <CustomImage src="path/to/image.png" alt="Sample image" />
</Layout>
```
