import { describe, expect, test } from "vitest";

import { xxHash3Hasher } from "../../extras/xxHash3Hasher.js";
import { deterministicHash } from "./deterministicHash.js";

describe("Unit/api/utils/deterministicHash", () => {
  test("default", () => {
    expect(
      deterministicHash({ deterministicHash: true }, xxHash3Hasher),
    ).toMatchInlineSnapshot(`"1f22ec1f7f45481f"`);
  });
});
