import { type Mock, beforeEach, describe, expect, test, vi } from 'vitest';

import { prepareDevProvisionalState } from './prepareDevProvisionalState.js';
import { resolveWidths } from './resolveWidths.js';

vi.mock('sharp', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 3000, height: 2000 }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('./resolveWidths.js', () => ({
  resolveWidths: vi.fn(),
}));

describe('prepareDevProvisionalState', () => {
  const source = {
    data: {},
    type: 'local',
    localSourcePath: '/src/assets/foo.png',
    options: { src: '/src/assets/foo.png', width: 1000 },
    resolved: {},
    ensureProvisionalResolution: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (resolveWidths as Mock).mockImplementation((target: typeof source) => {
      target.resolved.widths = [800];
      target.resolved.densities = [1];
    });
    source.data = {};
    source.resolved = {};
  });

  test('reads metadata and resolves provisional layout state', async () => {
    await prepareDevProvisionalState(source as never);

    expect(source.data).toEqual({ width: 3000, height: 2000 });
    expect(resolveWidths).toHaveBeenCalledWith(source);
    expect(source.resolved.width).toBeDefined();
    expect(source.resolved.height).toBeDefined();
  });

  test('uses width/height props for remote sources without metadata', async () => {
    const remoteSource = {
      ...source,
      type: 'remote',
      data: {},
      options: { src: 'https://example.com/foo.jpg', width: 800, height: 600 },
    };

    await prepareDevProvisionalState(remoteSource as never);

    expect(remoteSource.data).toEqual({ width: 800, height: 600 });
  });
});
