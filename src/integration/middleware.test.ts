import type { MiddlewareHandler } from 'astro';
import { describe, expect, test } from 'vitest';

import { onRequest } from './middleware.js';

const runMiddleware: MiddlewareHandler = onRequest;

describe('Unit/integration/middleware', () => {
  test('injects links and styles before </head>', async () => {
    const html = '<!DOCTYPE html><html><head><title>t</title></head><body></body></html>';
    const locals: App.Locals = {};
    const next = async () => {
      locals.__aipHead?.styles.push('<style>.foo{}</style>');
      locals.__aipHead?.links.push('<link rel="preload" href="/a">');
      return new Response(html, { headers: { 'content-type': 'text/html' } });
    };

    const response = await runMiddleware({ locals } as Parameters<MiddlewareHandler>[0], next);
    const result = await response.text();
    expect(result).toContain('<link rel="preload" href="/a"><style>.foo{}</style></head>');
  });

  test('passes through when nothing to inject', async () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    const next = async () => new Response(html, { headers: { 'content-type': 'text/html' } });

    const response = await runMiddleware({ locals: {} } as Parameters<MiddlewareHandler>[0], next);
    expect(await response.text()).toBe(html);
  });

  test('passes through non-html responses', async () => {
    const body = '{"ok":true}';
    const locals: App.Locals = {};
    const next = async () => {
      locals.__aipHead?.styles.push('<style>.foo{}</style>');
      return new Response(body, { headers: { 'content-type': 'application/json' } });
    };

    const response = await runMiddleware({ locals } as Parameters<MiddlewareHandler>[0], next);
    expect(await response.text()).toBe(body);
  });
});
