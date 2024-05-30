import { describe, expect, test } from "vitest";

import { isFirstElementNumber, isOutputFormat } from "./typeGuards.js";

describe("Unit/api/utils/typeGuards", () => {
  test("isFirstElementNumber", () => {
    expect(isFirstElementNumber([1, 2, 3])).toBeTruthy();
    expect(isFirstElementNumber(["1", "2", "3"])).toBeFalsy();
    expect(isFirstElementNumber([])).toBeFalsy();
  });

  test("isOutputFormat", () => {
    expect(isOutputFormat("avif")).toBeTruthy();
    expect(isOutputFormat("heic")).toBeFalsy();
  });
});
