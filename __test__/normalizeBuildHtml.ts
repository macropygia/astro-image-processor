/** Preload links injected into head by middleware */
const PRELOAD_LINK_RE = /<link rel="preload" as="image"[^>]*>/g;

/** Per-component scoped styles injected by middleware (not GlobalStyles) */
const AIP_INJECTED_STYLE_RE =
  /<style>(?:img|div|picture)\[data-astro-aip-[a-f0-9]+[\s\S]*?<\/style>/g;

function aipStyleSortKey(style: string): string {
  return style.match(/data-astro-aip-([a-f0-9]+)/)?.[1] ?? style;
}

/**
 * Normalize build HTML for stable snapshot comparison.
 * Middleware-injected preload links and scoped styles may appear in non-DOM order
 * when sibling components finish image processing concurrently.
 */
export function normalizeBuildHtml(html: string): string {
  const preloads = [...html.matchAll(PRELOAD_LINK_RE)].map((m) => m[0]);
  const aipStyles = [...html.matchAll(AIP_INJECTED_STYLE_RE)].map((m) => m[0]);

  if (preloads.length === 0 && aipStyles.length === 0) {
    return html;
  }

  const stripped = html.replace(PRELOAD_LINK_RE, '').replace(AIP_INJECTED_STYLE_RE, '');

  const injections = [
    ...preloads.sort(),
    ...aipStyles.sort((a, b) => aipStyleSortKey(a).localeCompare(aipStyleSortKey(b))),
  ].join('');

  return stripped.replace('</head>', `${injections}</head>`);
}
