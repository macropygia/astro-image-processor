import { describe, expect, test, vi } from 'vitest';

import { noopSpinner } from './noopSpinner.js';
import { noteVariantCompleted, noteVariantQueued } from './variantSpinnerProgress.js';

describe('variantSpinnerProgress', () => {
  test('delegates queued/completed to spinner with variant key', () => {
    const spinner = {
      ...noopSpinner,
      noteVariantQueued: vi.fn(),
      noteVariantCompleted: vi.fn(),
    };

    noteVariantQueued('source-hash\0profile-a', spinner);
    noteVariantCompleted('source-hash\0profile-a', spinner);

    expect(spinner.noteVariantQueued).toHaveBeenCalledWith('source-hash\0profile-a');
    expect(spinner.noteVariantCompleted).toHaveBeenCalledWith('source-hash\0profile-a');
  });
});
