import type { RenderTemplateResult } from "astro/runtime/server/render/astro/render-template.js";
import { describe, expect, test, vi } from "vitest";

import { generateHtmlByRender } from "./generateHtmlByRender.js";

describe("Unit/api/utils/generateHtmlByRender", () => {
  test("default", async () => {
    const mockResult = {
      render: vi.fn((destination) => {
        destination.write("<!DOCTYPE html>");
        destination.write("<html>");
        destination.write("<body>");
        destination.write("<h1>Hello, World!</h1>");
        destination.write("</body>");
        destination.write("</html>");
      }),
    } as unknown as RenderTemplateResult;

    const html = await generateHtmlByRender(mockResult);

    expect(html).toEqual(
      "<!DOCTYPE html><html><body><h1>Hello, World!</h1></body></html>",
    );
  });
});
