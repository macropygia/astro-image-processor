---
title: Hasher
# description:
---

Bufferまたは文字列からハッシュを生成するハッシュ生成器。

ハッシュアルゴリズムを変更するとハッシュの値が変わるためキャッシュの再構築が必要になる点に留意する。当然ながらHTMLにも変更が入る。

## ビルトインハッシュ生成器

本インテグレーションには2種類のハッシュ生成器が同梱されている。

### cryptoHasher (default)

標準モジュール `Crypto` を使用する。ハッシュアルゴリズムは `MD5` 。

```ts ins={2, 7}
// astro.config.js
import { cryptoHasher } from "astro-image-processor/extras/cryptoHasher.js";

export default defineConfig({
  integrations: [
    astroImageProcessor({
      hasher: cryptoHasher,
    })
  ]
});
```

### xxHash3Hasher

ハッシュアルゴリズムに `XXHash3` を使用する。 `Crypto` による `MD5` の生成より10倍以上高速なため、巨大なプロジェクトではCryptoより高速になる可能性がある。

[`xxhash-addon`](https://www.npmjs.com/package/xxhash-addon) と同ライブラリが使用するビルド用ツールチェインが必要。

```ts ins={2, 7}
// astro.config.js
import { xxHash3Hasher } from "astro-image-processor/extras/xxHash3Hasher.js";

export default defineConfig({
  integrations: [
    astroImageProcessor({
      hasher: xxHash3Hasher,
    })
  ]
});
```

## カスタムハッシュ生成器

任意のアルゴリズムのハッシュ生成器を作成可能。

```ts
import type { ImgProcHasher } from "astro-image-processor/types";

export const customHasher: ImgProcHasher = (
  buffer: Buffer | string
): string => {
  // ...
  return hash;
};
```
