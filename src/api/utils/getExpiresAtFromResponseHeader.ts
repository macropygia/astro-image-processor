type GetExpiresAtFromResponseHeader = (headers: Headers) => number | undefined;

/**
 * Get expires at from HTTP response header
 * @param headers HTTP reponse header
 * @returns Expires time (unixtime, ms)
 */
export const getExpiresAtFromResponseHeader: GetExpiresAtFromResponseHeader = (
  headers,
) => {
  const cacheControl = headers.get("cache-control");

  if (cacheControl) {
    const directives: string[][] = cacheControl
      .toLowerCase()
      .split(",")
      .map((directive) =>
        directive
          .trim()
          .split("=")
          .map((kv) => kv.trim()),
      );

    if (directives.find(([key]) => key === "no-cache" || key === "no-store")) {
      return;
    }

    const sMaxAge = directives.find(([key, val]) => key === "s-maxage" && val);
    if (sMaxAge) {
      return Date.now() + Number(sMaxAge[1]) * 1000;
    }

    const maxAge = directives.find(([key, val]) => key === "max-age" && val);
    if (maxAge) {
      return Date.now() + Number(maxAge[1]) * 1000;
    }
  }

  const expires = headers.get("expires");

  if (!expires) {
    return;
  }

  const expiresAt = new Date(expires).getTime();
  if (expiresAt < Date.now()) {
    return;
  }

  return expiresAt;
};
