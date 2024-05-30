import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { resolveExpiresAt } from "./resolveExpiresAt.js";

describe("Unit/api/utils/resolveExpiresAt", () => {
  const now = Date.now();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("undefined || undefined", () => {
    const result = resolveExpiresAt({
      expiresAt: undefined,
      minAge: undefined,
      maxAge: undefined,
    });
    expect(result).toBeUndefined();
  });

  test("undefined || minExpiresAt", () => {
    const minAge = 1000; // 1 second
    const result = resolveExpiresAt({
      expiresAt: undefined,
      minAge,
      maxAge: undefined,
    });
    expect(result).toBe(now + minAge);
  });

  test("minExpiresAt < expiresAt < maxExpiresAt", () => {
    const expiresAt = now + 5000; // 5 seconds from now
    const minAge = 1000; // 1 second
    const maxAge = 10000; // 10 seconds
    const result = resolveExpiresAt({ expiresAt, minAge, maxAge });
    expect(result).toBe(expiresAt);
  });

  test("expiresAt < minExpiresAt", () => {
    const expiresAt = now + 500; // 0.5 seconds from now
    const minAge = 1000; // 1 second
    const result = resolveExpiresAt({ expiresAt, minAge, maxAge: undefined });
    expect(result).toBe(now + minAge);
  });

  test("maxExpiresAt < expiresAt", () => {
    const expiresAt = now + 15000; // 15 seconds from now
    const maxAge = 10000; // 10 seconds
    const result = resolveExpiresAt({ expiresAt, minAge: undefined, maxAge });
    expect(result).toBe(now + maxAge);
  });
});
