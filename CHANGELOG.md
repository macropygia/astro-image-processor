# astro-image-processor

## 0.2.4

### Patch Changes

- a8c57df: **[BREAKING CHANGE]** Change the default `placeholder` to `null` and fix `componentProps.placeholder` from `astro.config` not being applied.

## 0.2.3

### Patch Changes

- eac3ac5: Fix typo

## 0.2.2

### Patch Changes

- 253327f: Fix Piscina worker failing in published packages by bundling `compressionWorker.js` for Node without `--experimental-strip-types` on `node_modules` paths.

## 0.2.1

### Patch Changes

- 86e1fd6: Change postinstall to prepare in npm scripts

## 0.2.0

### Minor Changes

- 9fc3a30: Add non-blocking dev rendering with provisional placeholders and background compression. Introduces `devConcurrency`, `devPlaceholder`, and `devReloadOnCompressComplete` integration settings.

### Patch Changes

- ca391eb: Replace p-queue with Piscina

## 0.1.10

### Patch Changes

- 74b91bb: Restore style/link elements injection

## 0.1.9

### Patch Changes

- 08f7ec1: Optimize variant generations
- b4c7838: Add dedicated image serving endpoint for dev server (default: `/_aip`, customizable via `devServerImageEndpoint` option)
- e4f2a26: Bump dependencies (Add Astro 6 to peerDependencies)

## 0.1.8

### Patch Changes

- fad506e: Add TypeScript global declaration for imageProcessorContext

## 0.1.7

### Patch Changes

- f5b3c5d: Fix peerDependencies range to allow newer sharp 0.x versions

## 0.1.6

### Patch Changes

- 4d5f340: Fix package.json to build xxhash-addon with pnpm v10
- 448d4f4: Fix to stop the spinner when an error occurs
- 6cabecf: Bump dependencies

## 0.1.5

### Patch Changes

- b96b2de: Bump dependencies

## 0.1.4

### Patch Changes

- a456fe5: Fix to round off calculated width or height

## 0.1.3

### Patch Changes

- a7dc99b: Fix to output sizes correctly

## 0.1.2

### Patch Changes

- a1743e2: **[BREAKING CHANGE]** Rebuild layout properties
- 86406e6: Fix the bug where density was always used
- 2bd79e5: **[BREAKING CHANGE]** Delete named exports of components
- 2bd79e5: Fix type definition

## 0.1.1

### Patch Changes

- e847c35: Bump dependencies
- e847c35: **[BREAKING CHANGE]** Fix global styles
- e847c35: Optimize console output

## 0.1.0

### Minor Changes

- 395051a: Initial release
