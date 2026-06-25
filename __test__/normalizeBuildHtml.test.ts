import { describe, expect, test } from 'vitest';

import { normalizeBuildHtml } from './normalizeBuildHtml.js';

describe('Unit/__test__/normalizeBuildHtml', () => {
  test('sorts injected preload links and aip styles before </head>', () => {
    const html =
      '<!DOCTYPE html><html><head><title>t</title><style>:root{}</style>' +
      '<link rel="preload" as="image" imagesizes="100vw" href="/b">' +
      '<style>img[data-astro-aip-bbbbbbbb]{color:red}</style>' +
      '<link rel="preload" as="image" imagesizes="50vw" href="/a">' +
      '<style>img[data-astro-aip-aaaaaaaa]{color:blue}</style>' +
      '</head><body></body></html>';

    expect(normalizeBuildHtml(html)).toBe(
      '<!DOCTYPE html><html><head><title>t</title><style>:root{}</style>' +
        '<link rel="preload" as="image" imagesizes="100vw" href="/b">' +
        '<link rel="preload" as="image" imagesizes="50vw" href="/a">' +
        '<style>img[data-astro-aip-aaaaaaaa]{color:blue}</style>' +
        '<style>img[data-astro-aip-bbbbbbbb]{color:red}</style>' +
        '</head><body></body></html>',
    );
  });

  test('returns original html when nothing to normalize', () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    expect(normalizeBuildHtml(html)).toBe(html);
  });
});
