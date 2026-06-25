import type { MiddlewareHandler } from 'astro';

export function defineMiddleware(fn: MiddlewareHandler): MiddlewareHandler {
  return fn;
}
