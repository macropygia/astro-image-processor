type PlaceholderMode = 'dominantColor' | 'blurred' | null;

type DominantRgb = {
  r?: number;
  g?: number;
  b?: number;
};

export const shouldGenerateBlurredPlaceholder = (placeholder: PlaceholderMode) =>
  placeholder === 'blurred' && import.meta.env.MODE !== 'development';

export const usesDominantColorPlaceholderCss = (placeholder: PlaceholderMode) =>
  placeholder === 'dominantColor';

export const usesBlurredPlaceholderCss = (placeholder: PlaceholderMode, blurredDataUrl?: string) =>
  placeholder === 'blurred' && !!blurredDataUrl;

export const resolveDominantPlaceholderColor = (
  _placeholder: PlaceholderMode,
  placeholderColor: string | undefined,
  data: DominantRgb,
) => placeholderColor || `rgb(${data.r} ${data.g} ${data.b})`;
