/**
 * fetch with timeout
 * - Default timeout: 5sec
 * @param input - Request URL
 * @param init - Config for fetch
 * @returns Promise<Response>
 */
export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutDuration?: number },
): Promise<Response> => {
  const { timeoutDuration = 5000 } = init || {};
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutDuration);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Fetch timeout");
    }
    throw e;
  }
};
