import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { notifyDevCompressComplete } from './devCompressComplete.js';
import { trackDevCompression, resetDevCompressionIdleForTests } from './devCompressionIdle.js';

vi.mock('./devCompressComplete.js', () => ({
  notifyDevCompressComplete: vi.fn(),
}));

describe('devCompressionIdle', () => {
  const onIdle = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    resetDevCompressionIdleForTests();
    globalThis.imageProcessorContext = {
      settings: { devReloadOnCompressComplete: false },
      compressionPool: { onIdle },
    } as never;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete globalThis.imageProcessorContext;
  });

  test('notifies once after inflight settles and pool is idle', async () => {
    let resolveTask: () => void = () => undefined;
    const task = new Promise<void>((resolve) => {
      resolveTask = resolve;
    });

    trackDevCompression(task);
    await vi.advanceTimersByTimeAsync(50);
    expect(notifyDevCompressComplete).not.toHaveBeenCalled();

    resolveTask();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(50);
    await Promise.resolve();

    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(notifyDevCompressComplete).toHaveBeenCalledTimes(1);
    expect(notifyDevCompressComplete).toHaveBeenCalledWith({
      reload: false,
      elapsedMs: expect.any(Number),
    });
  });

  test('dedupes the same promise in inflight tracking', async () => {
    const task = Promise.resolve();
    trackDevCompression(task);
    trackDevCompression(task);

    await vi.advanceTimersByTimeAsync(50);
    await Promise.resolve();

    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(notifyDevCompressComplete).toHaveBeenCalledTimes(1);
  });
});
