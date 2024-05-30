import {
  type AstroComponentFactory,
  createComponent,
  createHeadAndContent,
  renderTemplate,
} from "astro/runtime/server/index.js";

type InjectStyle = (css: string | string[]) => Promise<AstroComponentFactory>;

/**
 * Inject style element(s) to head element
 * @param css Raw CSS string(s)
 * @returns Astro component
 */
export const injectStyle: InjectStyle = async (css) => {
  const html: string = Array.isArray(css)
    ? `<style>${css.join("")}</style>`
    : `<style>${css}</style>`;

  return createComponent({
    factory(_result, _props, _slots) {
      return createHeadAndContent(html, renderTemplate``);
    },
    moduleId: "astro-image-processor-inject-styles",
    propagation: "self",
  });
};
