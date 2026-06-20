import { defineConfig } from 'oxfmt';

export default defineConfig({
  semi: true,
  singleQuote: true,
  sortImports: {
    newlinesBetween: true,
  },
  ignorePatterns: ['**/__snapshots__/**'],
});
