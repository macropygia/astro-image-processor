---
title: Hasher
# description:
---

Hash generator for generating hashes from buffers or strings.

Note that changing the hash algorithm will change the hash value, requiring cache rebuilds. Naturally, this also affects HTML.

## Built-in Hasher

This integration includes two built-in hashers.

### cryptoHasher (default)

Uses the `Crypto` module. Hash algorithm is `MD5`.

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

Uses `XXHash3` hash algorithm. Over 10 times faster than `MD5` generation by `Crypto`.

Requires [`xxhash-addon`](https://www.npmjs.com/package/xxhash-addon) and the toolchain used to build the binary.

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

## Custom Hasher

Custom hasher for any algorithm can be created.

```ts
import type { ImgProcHasher } from "astro-image-processor/types";

export const customHasher: ImgProcHasher = (
  buffer: Buffer | string
): string => {
  // ...
  return hash;
};
```
