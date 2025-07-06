import { describe, expect, test } from "vitest";

import { mockOptions } from "#mock/mock.js";
import { defineConfig } from "./index.js";

describe("defineConfig", () => {
  test("default", () => {
    const result = defineConfig(mockOptions);
    expect(result).toBe(mockOptions);
  });

  test("empty", () => {
    const result = defineConfig(undefined);
    expect(result).toBeUndefined();
  });
});
