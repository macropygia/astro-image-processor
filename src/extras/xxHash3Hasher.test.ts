import { describe, expect, test } from "vitest";

import { xxHash3Hasher } from "./xxHash3Hasher.js";

describe("Unit/extras/xxHash3Hasher", () => {
  test("buffer", () => {
    expect(xxHash3Hasher(Buffer.from("xxHash3Hasher"))).toBe(
      "a51ff2e4672f70a1",
    );
  });
  test("string", () => {
    expect(xxHash3Hasher("xxHash3Hasher")).toBe("a51ff2e4672f70a1");
  });
});
