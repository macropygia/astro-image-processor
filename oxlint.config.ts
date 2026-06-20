import { defineConfig } from 'oxlint';

export default defineConfig({
  ignorePatterns: ['**/__snapshots__/**', '**/website/**', '**/*.test.ts'],
  rules: {
    'triple-slash-reference': 'off',
    'no-unused-vars': [
      'error',
      {
        ignoreRestSiblings: true,
        caughtErrors: 'none',
        argsIgnorePattern: '^_',
      },
    ],
  },
});
