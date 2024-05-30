import { fetchWithTimeout } from "./extendedFetch.js";
import { getExpiresAtFromResponseHeader } from "./getExpiresAtFromResponseHeader.js";

type GetBufferFromRemoteUrl = (
  urlLike: string,
  timeout: number,
) => Promise<{ buffer: Buffer; expiresAt: number | undefined }>;

export const getBufferFromRemoteUrl: GetBufferFromRemoteUrl = async (
  urlLike,
  timeout,
) => {
  const url = new URL(urlLike);

  return await fetchWithTimeout(url, { timeoutDuration: timeout })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to download: ${urlLike} (${res.status})`);
      }
      const expiresAt = getExpiresAtFromResponseHeader(res.headers);

      return { buffer: Buffer.from(await res.arrayBuffer()), expiresAt };
    })
    .catch((err: unknown) => {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Unknown error: ${urlLike}`);
    });
};
