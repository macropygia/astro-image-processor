import { afterEach, describe, expect, test, vi } from 'vitest';

import { notifyDevCompressComplete } from './devCompressComplete.js';
import { sendDevFullReload, setDevUpgradeHot } from './devUpgradeHot.js';

vi.mock('./devUpgradeHot.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./devUpgradeHot.js')>();
  return {
    ...actual,
    sendDevFullReload: vi.fn(actual.sendDevFullReload),
    isDevUpgradeHotConfigured: vi.fn(actual.isDevUpgradeHotConfigured),
  };
});

import { isDevUpgradeHotConfigured } from './devUpgradeHot.js';

describe('notifyDevCompressComplete', () => {
  afterEach(() => {
    setDevUpgradeHot(undefined);
    delete globalThis.imageProcessorContext;
    vi.clearAllMocks();
  });

  test('always logs completion via logger', () => {
    const info = vi.fn();
    globalThis.imageProcessorContext = {
      logger: { info },
    } as never;

    notifyDevCompressComplete({
      reload: false,
      elapsedMs: 500,
    });

    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toContain('[aip]');
    expect(info.mock.calls[0]?.[0]).toContain('500ms');
    expect(sendDevFullReload).not.toHaveBeenCalled();
  });

  test('sends full-reload when reload is enabled and hot is configured', () => {
    const info = vi.fn();
    globalThis.imageProcessorContext = {
      logger: { info },
    } as never;
    setDevUpgradeHot({ send: vi.fn() });
    vi.mocked(isDevUpgradeHotConfigured).mockReturnValue(true);

    notifyDevCompressComplete({
      reload: true,
    });

    expect(info).toHaveBeenCalled();
    expect(sendDevFullReload).toHaveBeenCalled();
  });

  test('does not reload when reload flag is false', () => {
    setDevUpgradeHot({ send: vi.fn() });
    vi.mocked(isDevUpgradeHotConfigured).mockReturnValue(true);

    notifyDevCompressComplete({
      reload: false,
    });

    expect(sendDevFullReload).not.toHaveBeenCalled();
  });
});
