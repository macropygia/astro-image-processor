import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getExpiresAtFromResponseHeader } from "./getExpiresAtFromResponseHeader.js";

const toSec = (ms?: number) => (ms ? Math.floor(ms / 1000) : ms);

describe("Unit/api/utils/getExpiresAtFromResponseHeader", () => {
  const now = Date.now();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("s-maxage", () => {
    const headers: Headers = new Headers({
      "cache-control": "max-age=1, s-maxage=2",
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(toSec(result)).toBe(toSec(Date.now() + 2000));
  });

  test("max-age", () => {
    const headers: Headers = new Headers({
      "cache-control": "max-age=1",
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(toSec(result)).toBe(toSec(Date.now() + 1000));
  });

  test("expires", () => {
    const headers: Headers = new Headers({
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(toSec(result)).toBe(toSec(Date.now() + 3000));
  });

  test("expires (expired)", () => {
    const headers: Headers = new Headers({
      expires: new Date(Date.now() - 1000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(result).toBeUndefined();
  });

  test("no-cache", () => {
    const headers: Headers = new Headers({
      "cache-control": "max-age=1, s-maxage=2, no-cache",
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(result).toBeUndefined();
  });

  test("no-store", () => {
    const headers: Headers = new Headers({
      "cache-control": "max-age=1, s-maxage=2, no-store",
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(result).toBeUndefined();
  });

  test("no-cache and no-store", () => {
    const headers: Headers = new Headers({
      "cache-control": "max-age=1, s-maxage=2, no-cache, no-store",
      expires: new Date(Date.now() + 3000).toUTCString(),
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(result).toBeUndefined();
  });

  test("nothing", () => {
    const headers: Headers = new Headers({
      "content-length": "1024",
    });

    const result = getExpiresAtFromResponseHeader(headers);

    expect(result).toBeUndefined();
  });
});
