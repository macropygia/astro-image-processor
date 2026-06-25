import type { AstroFactoryReturnValue } from 'astro/runtime/server/render/astro/factory.js';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { AIP_HEAD_KEY, createAipHeadStorage } from './headStorage.js';
import { injectStyle } from './injectStyle.js';

describe('Unit/integration/injectStyle', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('stores style in head storage in production', () => {
    vi.stubEnv('PROD', true);
    const locals: App.Locals = { [AIP_HEAD_KEY]: createAipHeadStorage() };
    const render = injectStyle('.test{color:red}', locals);
    render({}, {}, {});
    expect(locals.__aipHead?.styles).toEqual(['<style>.test{color:red}</style>']);
  });

  test('array in production', () => {
    vi.stubEnv('PROD', true);
    const locals: App.Locals = { [AIP_HEAD_KEY]: createAipHeadStorage() };
    const render = injectStyle(['.test1{color:red}', '.test2{color:blue}'], locals);
    render({}, {}, {});
    expect(locals.__aipHead?.styles).toEqual([
      '<style>.test1{color:red}.test2{color:blue}</style>',
    ]);
  });

  test('renders inline style in development', () => {
    vi.stubEnv('PROD', false);
    const render = injectStyle('.test{color:red}');
    const result = render({}, {}, {}) as AstroFactoryReturnValue;
    expect(String(result)).toContain('<style>.test{color:red}</style>');
  });
});
