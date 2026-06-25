import { beforeEach, describe, expect, test, vi } from 'vitest';

import { SharedSpinner } from './SharedSpinner.js';

vi.mock('ora', () => {
  const instances: Array<{
    isSpinning: boolean;
    text: string;
    prefixText: string;
    start: ReturnType<typeof vi.fn>;
    succeed: ReturnType<typeof vi.fn>;
    fail: ReturnType<typeof vi.fn>;
  }> = [];

  const createSpinner = () => {
    const spinner = {
      isSpinning: false,
      text: '',
      prefixText: '',
      start: vi.fn(() => {
        spinner.isSpinning = true;
        return spinner;
      }),
      succeed: vi.fn(() => {
        spinner.isSpinning = false;
        return spinner;
      }),
      fail: vi.fn(() => {
        spinner.isSpinning = false;
        return spinner;
      }),
      stop: vi.fn(() => {
        spinner.isSpinning = false;
        return spinner;
      }),
    };
    instances.push(spinner);
    return spinner;
  };

  return {
    __esModule: true,
    default: vi.fn(createSpinner),
    instances,
  };
});

describe('Unit/api/utils/SharedSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('uses a single ora instance for concurrent jobs', async () => {
    const ora = (await import('ora')).default as unknown as ReturnType<typeof vi.fn>;
    const manager = new SharedSpinner();

    const first = manager.create('img', '/a.png');
    const second = manager.create('picture', '/b.png');

    expect(ora).toHaveBeenCalledTimes(1);

    first.spinner.setVariantProgress(1, 2);
    second.spinner.setVariantProgress(0, 3);

    first.spinner.succeed('Completed a');
    expect(ora.mock.results[0]?.value.isSpinning).toBe(true);

    second.spinner.succeed('Completed b');
    expect(ora.mock.results[0]?.value.succeed).toHaveBeenCalledWith('Completed b');
  });

  test('reuses the same job when a dedupe key is provided', () => {
    const manager = new SharedSpinner();

    const first = manager.create('img', '/a.png', 'same-key');
    first.spinner.noteVariantQueued('v1');
    first.spinner.noteVariantQueued('v1');
    first.spinner.noteVariantCompleted('v1');
    first.spinner.noteVariantCompleted('v1');

    const second = manager.create('picture', '/a.png', 'same-key');
    second.spinner.noteVariantQueued('v2');

    first.spinner.succeed('Completed a');
    second.spinner.succeed('Completed a');
  });

  test('does not count completed variants that were not queued', async () => {
    const ora = (await import('ora')).default as unknown as ReturnType<typeof vi.fn>;
    const manager = new SharedSpinner();
    const { spinner } = manager.create('img', '/a.png');

    spinner.noteVariantCompleted('ghost');
    spinner.noteVariantQueued('v1');
    spinner.noteVariantCompleted('v1');

    expect(ora.mock.results[0]?.value.text).toBe('Processing... (1/1)');
  });
});
