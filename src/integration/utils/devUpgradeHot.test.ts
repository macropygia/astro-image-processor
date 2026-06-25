import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  isDevUpgradeHotConfigured,
  sendDevFullReload,
  setDevUpgradeHot,
  setDevUpgradeHotFromServer,
} from './devUpgradeHot.js';

describe('devUpgradeHot', () => {
  beforeEach(() => {
    setDevUpgradeHot(undefined);
  });

  test('setDevUpgradeHotFromServer stores server.hot on globalThis', () => {
    const hot = { send: vi.fn() };
    setDevUpgradeHotFromServer({ hot } as never);

    expect(globalThis.__aipDevUpgradeHot).toBe(hot);
    expect(isDevUpgradeHotConfigured()).toBe(true);
  });

  test('sendDevFullReload sends full-reload when hot is configured', () => {
    const send = vi.fn();
    setDevUpgradeHot({ send });

    sendDevFullReload();

    expect(send).toHaveBeenCalledWith({ type: 'full-reload' });
  });

  test('sendDevFullReload is a no-op when hot is not configured', () => {
    expect(() => sendDevFullReload()).not.toThrow();
  });
});
