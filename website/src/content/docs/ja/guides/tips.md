---
title: Tips
# description:
---

## dev サーバーの挙動

`astro dev` では、全バリアントの圧縮完了を待たずに HTML を先に返す:

- **キャッシュヒット**: build と同様の最終マークアップ
- **キャッシュミス**: `devPlaceholder`（既定: 元の `src`）による暫定マークアップを表示しつつ、Piscina でバックグラウンド圧縮を実行

関連するインテグレーション設定:

```ts
astroImageProcessor({
    devConcurrency: 3, // dev 時の Piscina maxThreads（既定: 3）
    devReloadOnCompressComplete: false, // 圧縮完了後の full-reload（既定: false）
    componentProps: {
        devPlaceholder: 'source', // dev 時の暫定 src（既定: 'source'）
    },
});
```

- `devReloadOnCompressComplete: false` のときは、ログに `[aip] Dev compression complete` が出たあと手動でリロードする
- dev では `<link rel="preload">` は出力されない（`injectLink` は no-op）。スタイルはプレビュー用に body 内インラインで描画される。詳細は [&lt;InjectStyle /&gt;](/astro-image-processor/ja/component/inject-style/) を参照

## 複数のプロパティをまとめて指定する

```typescript
// templates.ts
import type { ImgProcPictureComponentProps } from 'astro-image-processor/types';

export const templateObject: Pick<
    ImgProcPictureComponentProps,
    'formats' | 'placeholder' | 'layout' | 'densities'
> = {
    formats: ['avif', 'webp', 'png'],
    placeholder: 'dominantColor',
    layout: 'fullWidth',
    densities: [1, 2, 3],
};
```

```jsx
// foo.astro
---
import Picture from 'astro-image-processor/components/Picture.astro';
import { templateObject } from 'path/to/templates';
---

<Picture
  src='/src/assets/images/foo.png'
  alt='Alt text'
  width={1000}
  height={500}
  {...templateObject}
/>
```
