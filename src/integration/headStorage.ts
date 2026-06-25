export interface AipHeadStorage {
  styles: string[];
  links: string[];
  /** Set by integration middleware; used to distinguish from unrelated locals values */
  readonly __aipMiddleware?: true;
}

export const AIP_HEAD_KEY = '__aipHead' as const;

export function createAipHeadStorage(): AipHeadStorage {
  return { styles: [], links: [], __aipMiddleware: true };
}

export function getAipHeadStorage(locals: App.Locals): AipHeadStorage | undefined {
  const head = locals[AIP_HEAD_KEY];
  return head?.__aipMiddleware ? head : undefined;
}
