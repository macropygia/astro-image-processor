import type { BaseSource } from '../BaseSource.js';
import { getMetadataFromBuffer } from '../utils/getMetadataFromBuffer.js';

/** Synchronously ensure dominant RGB metadata is available in development. */
export const ensureDevDominantColorMetadata = async (source: BaseSource): Promise<void> => {
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  const {
    options: { placeholder, placeholderColor, processor },
    data,
    db,
  } = source;

  if (placeholder !== 'dominantColor' || placeholderColor) {
    return;
  }

  if (data.r !== undefined && data.g !== undefined && data.b !== undefined) {
    return;
  }

  if (data.hash) {
    const existing = await db.fetch({ hash: data.hash });
    if (existing?.r !== undefined && existing.g !== undefined && existing.b !== undefined) {
      Object.assign(data, { r: existing.r, g: existing.g, b: existing.b });
      return;
    }
  }

  const buffer = await source.getBuffer();
  const metadata = await getMetadataFromBuffer({
    buffer,
    useDominant: true,
    processor,
  });

  Object.assign(data, metadata);

  if (
    data.hash &&
    metadata.r !== undefined &&
    metadata.g !== undefined &&
    metadata.b !== undefined
  ) {
    await db.updateMetadata({
      hash: data.hash,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      r: metadata.r,
      g: metadata.g,
      b: metadata.b,
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
    });
  }
};
