---
title: Data Adapter
# description:
---

Data adapter that mediates data objects within the database and integration used for cache management. Like DAO or ORM.

## Built-in Data Adapters

This integration includes three types of data adapters.

### JsonFileDataAdapter (default)

A data adapter that saves data to a single JSON file.

- By default, saves to `cache.json` in the image cache directory.
- On the dev server, if there is no activity for 1 second after the last operation on the database object, the data is written to the file.

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

A data adapter that utilizes the lightweight document database [LokiJS](https://github.com/techfort/LokiJS).

- By default, saves to `cache.db` in the image cache directory.
- On the dev server, data is written to the file every 10 seconds.

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

A data adapter that utilizes the [Bun built-in SQLite driver](https://bun.sh/docs/api/sqlite).

- Only available for use with [Bun](https://bun.sh/).
- By default, saves to `cache.sqlite` in the image cache directory.

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

## Custom Data Adapter

Custom data adapters can be created following the `ImgProcDataAdapter` interface.

```ts
import { ImgProcDataAdapter } from "astro-image-processor/types";

export class CustomDataAdapter implements ImgProcDataAdapter {
  // ...
}
```

Refer to the implementation of built-in data adapters for details.
