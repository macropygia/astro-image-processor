import {
  type AstroComponentFactory,
  createComponent,
  createHeadAndContent,
  renderTemplate,
} from "astro/runtime/server/index.js";
import { internalSpreadAttributes } from "astro/runtime/server/render/util.js";
import type { HTMLAttributes } from "astro/types";

import { generateHtmlByRender } from "../api/utils/generateHtmlByRender.js";

type InjectLink = (
  linkAttributes: HTMLAttributes<"link"> | HTMLAttributes<"link">[],
) => Promise<AstroComponentFactory>;

/**
 * Inject link element to head element
 * @param linkAttributes
 * @returns Astro component
 */
export const injectLink: InjectLink = async (linkAttributes) => {
  const html: string = Array.isArray(linkAttributes)
    ? (
        await Promise.all(
          linkAttributes.map((attr) =>
            generateHtmlByRender(
              renderTemplate`<link${internalSpreadAttributes(attr, false, "link")}>`,
            ),
          ),
        )
      ).join("")
    : await generateHtmlByRender(
        renderTemplate`<link${internalSpreadAttributes(linkAttributes, false, "link")}>`,
      );

  return createComponent({
    factory(_result, _props, _slots) {
      return createHeadAndContent(html, renderTemplate``);
    },
    moduleId: "astro-image-processor-inject-link",
    propagation: "self",
  });
};
