import type { ImgProcSpinnerHandle } from './SharedSpinner.js';

export const noopSpinner: ImgProcSpinnerHandle = {
  set text(_value: string) {},
  setVariantProgress(_completed: number, _total: number) {},
  noteVariantQueued(_variantKey: string) {},
  noteVariantCompleted(_variantKey: string) {},
  resetVariantProgress() {},
  succeed(_message?: string) {},
  fail(_message?: string) {},
  cancel() {},
};
