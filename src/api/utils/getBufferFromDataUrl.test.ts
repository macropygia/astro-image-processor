import { describe, expect, test } from "vitest";

import { getBufferFromDataUrl } from "./getBufferFromDataUrl.js";

describe("Unit/api/utils/getBufferFromDataUrl", () => {
  test("default", () => {
    const phrase = "getBufferFromDataUrl";
    const base64 = Buffer.from(phrase).toString("base64");
    const buffer = getBufferFromDataUrl(`data:image/png;base64,${base64}`);

    expect(buffer.toString()).toBe(phrase);
  });
});
