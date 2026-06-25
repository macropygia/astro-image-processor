import type { ImgProcSpinnerHandle } from './SharedSpinner.js';

/** @deprecated Progress is tracked per spinner job; kept for config-reload cleanup. */
export const clearVariantSpinnerProgress = () => {};

export const noteVariantQueued = (variantKey: string, spinner: ImgProcSpinnerHandle): void => {
  spinner.noteVariantQueued(variantKey);
};

export const noteVariantCompleted = (variantKey: string, spinner: ImgProcSpinnerHandle): void => {
  spinner.noteVariantCompleted(variantKey);
};
