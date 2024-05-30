---
title: <InjectStyle />
# description:
---

`<InjectStyle>` component injects `<style>` element into the `<head>` element.

```astro
---
import { injectStyle } from "astro-image-processor/components";

const css: string | string[] = ".foo { color: red; }";

const InjectStyle = await injectStyle(css);
---

<InjectStyle />
```
