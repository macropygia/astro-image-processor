import type { ImgProcContext } from '../../types.js';
import { notifyDevCompressComplete } from './devCompressComplete.js';

const IDLE_DEBOUNCE_MS = 50;

const inflight = new Set<Promise<unknown>>();
let hadCompressionWork = false;
let compressionStartedAt: number | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let idleCheckInFlight = false;

const scheduleIdleCheck = () => {
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    void notifyWhenGloballyIdle();
  }, IDLE_DEBOUNCE_MS);
};

const notifyWhenGloballyIdle = async () => {
  if (idleCheckInFlight || inflight.size > 0 || !hadCompressionWork) {
    return;
  }

  const ctx = globalThis.imageProcessorContext as ImgProcContext | undefined;
  const pool = ctx?.compressionPool;
  if (!pool) {
    return;
  }

  idleCheckInFlight = true;
  try {
    await pool.onIdle();
    if (inflight.size > 0) {
      return;
    }

    const elapsedMs =
      compressionStartedAt !== undefined
        ? Math.round(performance.now() - compressionStartedAt)
        : undefined;
    const reload = ctx.settings.devReloadOnCompressComplete === true;

    notifyDevCompressComplete({
      reload,
      ...(elapsedMs !== undefined ? { elapsedMs } : {}),
    });

    hadCompressionWork = false;
    compressionStartedAt = undefined;
  } finally {
    idleCheckInFlight = false;
  }
};

export const trackDevCompression = (promise: Promise<unknown>) => {
  if (compressionStartedAt === undefined) {
    compressionStartedAt = performance.now();
  }
  hadCompressionWork = true;
  inflight.add(promise);

  void promise.finally(() => {
    inflight.delete(promise);
    scheduleIdleCheck();
  });
};

export const resetDevCompressionIdleForTests = () => {
  inflight.clear();
  hadCompressionWork = false;
  compressionStartedAt = undefined;
  idleCheckInFlight = false;
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
};
