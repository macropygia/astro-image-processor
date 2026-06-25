import type { AipHeadStorage } from './headStorage.js';

export function injectHeadIntoHtml(html: string, head: AipHeadStorage): string {
  const injections = [...head.links, ...head.styles];
  if (injections.length === 0) return html;
  const idx = html.indexOf('</head>');
  if (idx === -1) return html;
  return html.slice(0, idx) + injections.join('') + html.slice(idx);
}
