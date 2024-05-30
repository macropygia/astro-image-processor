import type { RenderTemplateResult } from "astro/runtime/server/render/astro/render-template.js";
import type { RenderDestination } from "astro/runtime/server/render/common.js";

type generateHtmlByRender = (result: RenderTemplateResult) => Promise<string>;

/**
 * Simple `RenderDestination` to get html from Astro render
 * - Only string chunk can be used
 * @param result Astro `RenderTemplateResult`
 * @returns HTML string
 */
export const generateHtmlByRender: generateHtmlByRender = async (result) => {
  let html = "";

  const destination: RenderDestination = {
    write(chunk) {
      html += chunk;
    },
  };

  await result.render(destination);

  return html;
};
