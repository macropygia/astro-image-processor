import type { AstroFactoryReturnValue } from "astro/runtime/server/render/astro/factory.js";
import { describe, expect, test } from "vitest";

import { injectLink } from "./injectLink.js";

describe("Unit/components/injectLink", () => {
  test("string", async () => {
    const render = await injectLink({
      rel: "stylesheet",
      href: "https://example.com/styles.css",
    });
    const result = render({}, {}, {}) as AstroFactoryReturnValue & {
      head: string;
    };
    expect(result.head).toBe(
      `<link rel="stylesheet" href="https://example.com/styles.css">`,
    );
  });

  test("array", async () => {
    const render = await injectLink([
      {
        rel: "stylesheet",
        href: "https://example.com/styles1.css",
      },
      {
        rel: "stylesheet",
        href: "https://example.com/styles2.css",
      },
    ]);
    const result = render({}, {}, {}) as AstroFactoryReturnValue & {
      head: string;
    };
    expect(result.head).toBe(
      `<link rel="stylesheet" href="https://example.com/styles1.css"><link rel="stylesheet" href="https://example.com/styles2.css">`,
    );
  });
});
