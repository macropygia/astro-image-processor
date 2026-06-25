import type { AipHeadStorage } from './headStorage.js';

function sortedHtml(items: AipHeadStorage['styles']): string[] {
  return [...items].sort((a, b) => a.sequence - b.sequence).map((item) => item.html);
}

export function injectHeadIntoHtml(html: string, head: AipHeadStorage): string {
  const injections = [...sortedHtml(head.links), ...sortedHtml(head.styles)];
  if (injections.length === 0) return html;
  const idx = html.indexOf('</head>');
  if (idx === -1) return html;
  return html.slice(0, idx) + injections.join('') + html.slice(idx);
}
