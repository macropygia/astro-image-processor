import type { AstroFactoryReturnValue } from "astro/runtime/server/render/astro/factory.js";
import { describe, expect, test } from "vitest";

import { injectStyle } from "./injectStyle.js";

describe("Unit/components/injectStyle", () => {
  test("string", async () => {
    const render = await injectStyle(".test{color:red}");
    const result = render({}, {}, {}) as AstroFactoryReturnValue & {
      head: string;
    };
    expect(result.head).toBe("<style>.test{color:red}</style>");
  });

  test("array", async () => {
    const render = await injectStyle([
      ".test1{color:red}",
      ".test2{color:blue}",
    ]);
    const result = render({}, {}, {}) as AstroFactoryReturnValue & {
      head: string;
    };
    expect(result.head).toBe(
      "<style>.test1{color:red}.test2{color:blue}</style>",
    );
  });
});
