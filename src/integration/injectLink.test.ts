import { afterEach, describe, expect, test, vi } from 'vitest';

import { AIP_HEAD_KEY, createAipHeadStorage } from './headStorage.js';
import { injectLink } from './injectLink.js';

describe('Unit/integration/injectLink', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('stores link in head storage in production', async () => {
    vi.stubEnv('PROD', true);
    const locals: App.Locals = { [AIP_HEAD_KEY]: createAipHeadStorage() };
    const render = await injectLink(
      {
        rel: 'stylesheet',
        href: 'https://example.com/styles.css',
      },
      locals,
    );
    render({}, {}, {});
    expect(locals.__aipHead?.links).toEqual([
      `<link rel="stylesheet" href="https://example.com/styles.css">`,
    ]);
  });

  test('array in production', async () => {
    vi.stubEnv('PROD', true);
    const locals: App.Locals = { [AIP_HEAD_KEY]: createAipHeadStorage() };
    const render = await injectLink(
      [
        {
          rel: 'stylesheet',
          href: 'https://example.com/styles1.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://example.com/styles2.css',
        },
      ],
      locals,
    );
    render({}, {}, {});
    expect(locals.__aipHead?.links).toEqual([
      `<link rel="stylesheet" href="https://example.com/styles1.css">`,
      `<link rel="stylesheet" href="https://example.com/styles2.css">`,
    ]);
  });

  test('renders nothing in development', async () => {
    vi.stubEnv('PROD', false);
    const render = await injectLink({
      rel: 'stylesheet',
      href: 'https://example.com/styles.css',
    });
    const result = render({}, {}, {}) as { htmlParts: string[]; expressions: unknown[] };
    expect(result.htmlParts.join('')).toBe('');
    expect(result.expressions).toEqual([]);
  });
});
