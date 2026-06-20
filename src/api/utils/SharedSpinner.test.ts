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
});
