import { createComponent, markHTMLString, renderTemplate } from 'astro/runtime/server/index.js';

import { getAipHeadStorage } from './headStorage.js';

/**
 * Inject style element(s) to head element
 * @param css Raw CSS string(s)
 * @param locals Request locals (`Astro.locals`); used when middleware provides head storage
 * @returns Astro component
 */
export function injectStyle(css: string | string[], locals?: App.Locals) {
  const cssStr = Array.isArray(css) ? css.join('') : css;
  const html = `<style>${cssStr}</style>`;

  return createComponent({
    factory() {
      // Dev server: middleware may run but does not rewrite prerendered HTML; render in place.
      if (!import.meta.env.PROD) {
        return markHTMLString(html);
      }
      const head = getAipHeadStorage(locals ?? ({} as App.Locals));
      head?.styles.push(html);
      return renderTemplate``;
    },
    moduleId: 'astro-image-processor-inject-styles',
  });
}
