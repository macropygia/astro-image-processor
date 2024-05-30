---
title: Data Adapter
# description:
---

キャッシュ管理に使用するデータベースとインテグレーション内のデータオブジェクトを中継するデータアダプター。簡易的なDAOないしORMのようなもの。

## ビルトインデータアダプター

本インテグレーションには3種類のデータアダプターが同梱されている。

### JsonFileDataAdapter (default)

データを単一のJSONファイルに保存するデータアダプター。

- 既定では画像キャッシュディレクトリの `cache.json` に保存する
- 開発サーバーではデータベースオブジェクトに対する最後の操作から1秒間操作がなければデータをファイルに書き出す

```ts ins={2-9,14}
// astro.config.ts
import {
  JsonFileDataAdapter,
  type JsonFileDataAdapterOptions,
} from "../src/extras/JsonFileDataAdapter.js";

const options: JsonFileDataAdapterOptions = {
  // ...
}

export default defineConfig({
  integrations: [
    astroImageProcessor({
      dataAdapter: new JsonFileDataAdapter(options),
    })
  ]
});
```

### LokiDataAdapter

JavaScript製の軽量ドキュメントデータベース[LokiJS](https://github.com/techfort/LokiJS)を使用するデータアダプター。

- 既定では画像キャッシュディレクトリの `cache.db` に保存する
- 開発サーバーでは10秒毎にデータをファイルに書き出す

```ts ins={2-9,14}
// astro.config.ts
import {
  LokiDataAdapter,
  type LokiDataAdapterOptions,
} from "../src/extras/LokiDataAdapter.js";

const options: LokiDataAdapterOptions = {
  // ...
}

export default defineConfig({
  integrations: [
    astroImageProcessor({
      dataAdapter: new LokiDataAdapter(options),
    })
  ]
});
```

### BunSqliteDataAdapter

[BunビルトインSQLiteドライバー](https://bun.sh/docs/api/sqlite)を使用するデータアダプター。

- [Bun](https://bun.sh/)でのみ使用可能
- 既定では画像キャッシュディレクトリの `cache.sqlite` に保存する

```ts ins={2-9,14}
// astro.config.ts
import {
  BunSqliteDataAdapter,
  type BunSqliteDataAdapterOptions,
} from "../src/extras/BunSqliteDataAdapter.js";

const options: BunSqliteDataAdapterOptions = {
  // ...
}

export default defineConfig({
  integrations: [
    astroImageProcessor({
      dataAdapter: new BunSqliteDataAdapter(options),
    })
  ]
});
```

## カスタムデータアダプター

`ImgProcDataAdapter` インターフェースに従って独自のデータアダプターを作成可能。

```ts
import { ImgProcDataAdapter } from "astro-image-processor/types";

export class CustomDataAdapter implements ImgProcDataAdapter {
  // ...
}
```

詳細はビルトインデータアダプター各種の実装を参照。
