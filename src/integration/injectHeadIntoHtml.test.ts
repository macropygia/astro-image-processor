import { describe, expect, test } from 'vitest';

import { createAipHeadStorage } from './headStorage.js';
import { injectHeadIntoHtml } from './injectHeadIntoHtml.js';

describe('Unit/integration/injectHeadIntoHtml', () => {
  test('injects links and styles before </head>', () => {
    const head = createAipHeadStorage();
    head.links.push({ sequence: 0, html: '<link rel="preload" href="/a">' });
    head.styles.push({ sequence: 1, html: '<style>.foo{}</style>' });
    const html = '<!DOCTYPE html><html><head><title>t</title></head><body></body></html>';
    expect(injectHeadIntoHtml(html, head)).toBe(
      '<!DOCTYPE html><html><head><title>t</title><link rel="preload" href="/a"><style>.foo{}</style></head><body></body></html>',
    );
  });

  test('returns original html when nothing to inject', () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    expect(injectHeadIntoHtml(html, createAipHeadStorage())).toBe(html);
  });

  test('sorts injections by sequence', () => {
    const head = createAipHeadStorage();
    head.styles.push({ sequence: 2, html: '<style>.c{}</style>' });
    head.styles.push({ sequence: 0, html: '<style>.a{}</style>' });
    head.styles.push({ sequence: 1, html: '<style>.b{}</style>' });
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    expect(injectHeadIntoHtml(html, head)).toBe(
      '<!DOCTYPE html><html><head><style>.a{}</style><style>.b{}</style><style>.c{}</style></head><body></body></html>',
    );
  });
});
