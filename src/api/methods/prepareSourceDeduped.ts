import type { BaseSource } from '../BaseSource.js';
import { PictureSource } from '../PictureSource.js';
import { deterministicHash } from '../utils/deterministicHash.js';

export type PreparedSourceSnapshot = {
  hash: string;
  blurredDataUrl?: string;
  resolved: BaseSource['resolved'];
  downloadPath?: string;
};

const inflightPrepare = new Map<string, Promise<PreparedSourceSnapshot>>();

export const clearPrepareDedupeState = () => {
  inflightPrepare.clear();
};

export const buildPrepareDedupeKey = (source: BaseSource): string => {
  const {
    componentType,
    localSourcePath,
    isArtDirective,
    options: {
      width,
      height,
      densities,
      widths,
      sizes,
      format,
      formats,
      placeholder,
      placeholderColor,
      artDirectives,
    },
  } = source;

  return deterministicHash(
    {
      componentType,
      localSourcePath,
      isArtDirective,
      width,
      height,
      densities,
      widths,
      sizes,
      format,
      formats: componentType === 'img' ? undefined : formats,
      placeholder,
      placeholderColor,
      artDirectives,
      profile: source.profile,
    },
    source.settings.hasher,
  );
};

const applyPrepareSnapshot = async (
  source: BaseSource,
  snapshot: PreparedSourceSnapshot,
): Promise<void> => {
  if (source.prepared) {
    return;
  }

  const currentData = await source.db.fetch({ hash: snapshot.hash });
  if (currentData) {
    Object.assign(source.data, currentData);
  } else {
    source.data.hash = snapshot.hash;
  }

  if (snapshot.blurredDataUrl !== undefined) {
    source.blurredDataUrl = snapshot.blurredDataUrl;
  }

  source.resolved = structuredClone(snapshot.resolved);

  if (snapshot.downloadPath !== undefined) {
    source.downloadPath = snapshot.downloadPath;
  }

  source.prepared = true;
};

export const prepareSourceDeduped = async (
  source: BaseSource,
  signal?: AbortSignal,
): Promise<void> => {
  if (source.prepared) {
    return;
  }

  if (signal?.aborted) {
    return;
  }

  if (import.meta.env.MODE !== 'development') {
    await source.prepare(signal ? { signal } : undefined);
    return;
  }

  const key = buildPrepareDedupeKey(source);
  let inflight = inflightPrepare.get(key);

  if (!inflight) {
    inflight = (async (): Promise<PreparedSourceSnapshot> => {
      if (!source.hasDevSpinner()) {
        source.ensureDevSpinner(key);
      }
      await source.prepare(signal ? { signal } : undefined);
      return {
        hash: source.data.hash as string,
        resolved: structuredClone(source.resolved),
        ...(source.blurredDataUrl !== undefined ? { blurredDataUrl: source.blurredDataUrl } : {}),
        ...(source.downloadPath !== undefined ? { downloadPath: source.downloadPath } : {}),
      };
    })();

    inflightPrepare.set(key, inflight);
    void inflight.finally(() => {
      if (inflightPrepare.get(key) === inflight) {
        inflightPrepare.delete(key);
      }
    });
  }

  try {
    const snapshot = await inflight;
    if (signal?.aborted) {
      return;
    }
    await applyPrepareSnapshot(source, snapshot);
    if (!source.hasDevSpinner()) {
      source.ensureDevSpinner(key);
    }
    if (source instanceof PictureSource) {
      await source.ensureDevArtDirectivesPrepared(signal ?? undefined);
    }
  } catch (error) {
    if (signal?.aborted) {
      return;
    }
    throw error;
  }
};
