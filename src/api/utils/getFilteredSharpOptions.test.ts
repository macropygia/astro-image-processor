import { describe, expect, test } from "vitest";

import type { SharpWithOptions } from "../../types.js";
import { getFilteredSharpOptions } from "./getFilteredSharpOptions";

describe("Unit/api/utils/getFilteredSharpOptions", () => {
  test("default", () => {
    expect(
      getFilteredSharpOptions({
        options: {
          debuglog: "debugLog",
          queueListener: () => undefined,
          input: [1, 2, 3],
          foo: 100,
          bar: "bar",
          baz: [4, 5, 6],
        },
      } as unknown as SharpWithOptions),
    ).toEqual({
      foo: 100,
      bar: "bar",
      baz: [4, 5, 6],
    });
  });
});
