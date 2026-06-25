import { describe, expect, test } from 'vitest';

import { createAipHeadStorage } from './headStorage.js';
import { injectHeadIntoHtml } from './injectHeadIntoHtml.js';

describe('Unit/integration/injectHeadIntoHtml', () => {
  test('injects links and styles before </head>', () => {
    const head = createAipHeadStorage();
    head.links.push('<link rel="preload" href="/a">');
    head.styles.push('<style>.foo{}</style>');
    const html = '<!DOCTYPE html><html><head><title>t</title></head><body></body></html>';
    expect(injectHeadIntoHtml(html, head)).toBe(
      '<!DOCTYPE html><html><head><title>t</title><link rel="preload" href="/a"><style>.foo{}</style></head><body></body></html>',
    );
  });

  test('returns original html when nothing to inject', () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    expect(injectHeadIntoHtml(html, createAipHeadStorage())).toBe(html);
  });
});
