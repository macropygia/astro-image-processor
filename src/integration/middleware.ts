import { defineMiddleware } from 'astro:middleware';

import { AIP_HEAD_KEY, createAipHeadStorage } from './headStorage.js';
import { injectHeadIntoHtml } from './injectHeadIntoHtml.js';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const head = createAipHeadStorage();
  ctx.locals[AIP_HEAD_KEY] = head;

  const response = await next();
  const injections = [...head.links, ...head.styles];
  if (injections.length === 0) return response;
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;
  const html = await response.text();
  const injected = injectHeadIntoHtml(html, head);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
