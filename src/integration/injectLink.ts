import { createComponent, renderTemplate } from 'astro/runtime/server/index.js';
import { internalSpreadAttributes } from 'astro/runtime/server/render/util.js';
import type { HTMLAttributes } from 'astro/types';

import { generateHtmlByRender } from '../api/utils/generateHtmlByRender.js';
import { getAipHeadStorage } from './headStorage.js';

/**
 * Inject link element to head element
 * @param linkAttributes
 * @param locals Request locals (`Astro.locals`); used when middleware provides head storage
 * @returns Astro component
 */
export async function injectLink(
  linkAttributes: HTMLAttributes<'link'> | HTMLAttributes<'link'>[],
  locals?: App.Locals,
) {
  if (!import.meta.env.PROD) {
    return createComponent({
      factory() {
        return renderTemplate``;
      },
      moduleId: 'astro-image-processor-inject-link',
    });
  }

  const links: string[] = Array.isArray(linkAttributes)
    ? await Promise.all(
        linkAttributes.map((attr) =>
          generateHtmlByRender(
            renderTemplate`<link${internalSpreadAttributes(attr, false, 'link')}>`,
          ),
        ),
      )
    : [
        await generateHtmlByRender(
          renderTemplate`<link${internalSpreadAttributes(linkAttributes, false, 'link')}>`,
        ),
      ];

  return createComponent({
    factory() {
      const head = getAipHeadStorage(locals ?? ({} as App.Locals));
      if (head) {
        for (const link of links) {
          head.links.push(link);
        }
      }
      return renderTemplate``;
    },
    moduleId: 'astro-image-processor-inject-link',
  });
}
