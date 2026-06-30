import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ImageSource } from '../../api/ImageSource.js';
import { applyDevFastPath } from '../../api/methods/applyDevFastPath.js';
import { enqueueDevCompressionMisses } from '../../api/methods/enqueueDevCompressionMisses.js';
import { peekBlurPlaceholder } from '../../api/methods/peekBlurPlaceholder.js';
import { runDevCacheProbe } from '../../api/methods/runDevCacheProbe.js';
import type { ImgProcContext } from '../../types.js';
import {
  resolveImageDevOutput,
  resolvePictureDevOutput,
  resolveBackgroundDevOutput,
} from './resolveDevComponent.js';

vi.mock('../../api/ImageSource.js', () => ({
  ImageSource: {
    buildImage: vi.fn(),
  },
}));

vi.mock('../../api/PictureSource.js', () => ({
  PictureSource: {
    buildPicture: vi.fn(),
  },
}));

vi.mock('../../api/BackgroundSource.js', () => ({
  BackgroundSource: {
    buildBackground: vi.fn(),
  },
}));

vi.mock('../../api/methods/runDevCacheProbe.js', () => ({
  runDevCacheProbe: vi.fn(),
  runDevPictureCacheProbe: vi.fn(),
  applyDevPictureFastPath: vi.fn(),
}));

vi.mock('../../api/methods/applyDevFastPath.js', () => ({
  applyDevFastPath: vi.fn(),
}));

vi.mock('../../api/methods/peekBlurPlaceholder.js', () => ({
  peekBlurPlaceholder: vi.fn(),
}));

vi.mock('../../api/methods/enqueueDevCompressionMisses.js', () => ({
  enqueueDevCompressionMisses: vi.fn(),
}));

const ctx = { settings: {} } as ImgProcContext;

const createImageSource = (overrides: Record<string, unknown> = {}) =>
  ({
    prepare: vi.fn().mockResolvedValue(undefined),
    finalize: vi.fn().mockResolvedValue(undefined),
    spinner: { fail: vi.fn() },
    imageAttributes: { src: '/final.webp' },
    imageClassList: ['aip-elm-img'],
    containerClassList: [],
    containerAttributes: {},
    css: '.final{}',
    link: null,
    placeholderImageAttributes: { src: '/hero.png' },
    devProvisionalCss: '.provisional{}',
    ...overrides,
  }) as never;

describe('resolveDevComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ImageSource.buildImage).mockReturnValue(createImageSource());
    vi.mocked(peekBlurPlaceholder).mockResolvedValue({ hit: false });
  });

  test('build mode runs prepare and finalize', async () => {
    const originalMode = import.meta.env.MODE;
    vi.stubEnv('MODE', 'production');

    const source = createImageSource();
    vi.mocked(ImageSource.buildImage).mockReturnValue(source);

    const out = await resolveImageDevOutput({
      ctx,
      options: { src: '/hero.png' },
    });

    expect(out.mode).toBe('build');
    expect(source.prepare).toHaveBeenCalled();
    expect(source.finalize).toHaveBeenCalled();
    expect(out.imageAttributes).toEqual({ src: '/final.webp' });
    expect(out.css).toBe('.final{}');

    vi.stubEnv('MODE', originalMode);
  });

  test('fast mode applies dev fast path output', async () => {
    const originalMode = import.meta.env.MODE;
    vi.stubEnv('MODE', 'development');

    vi.mocked(runDevCacheProbe).mockResolvedValue({
      allHit: true,
      hits: [],
      misses: [],
      variants: { webp: [] },
    });

    const out = await resolveImageDevOutput({
      ctx,
      options: { src: '/hero.png' },
    });

    expect(applyDevFastPath).toHaveBeenCalled();
    expect(out.mode).toBe('fast');
    expect(out.imageAttributes).toEqual({ src: '/final.webp' });

    vi.stubEnv('MODE', originalMode);
  });

  test('slow mode returns provisional output and enqueues misses', async () => {
    const originalMode = import.meta.env.MODE;
    vi.stubEnv('MODE', 'development');

    vi.mocked(runDevCacheProbe).mockResolvedValue({
      allHit: false,
      hits: [],
      misses: [{ variantProfileHash: 'p', variantFormat: 'webp', variantWidth: 800 }],
      variants: { webp: [] },
    });

    const out = await resolveImageDevOutput({
      ctx,
      options: { src: '/hero.png' },
    });

    expect(out.mode).toBe('slow');
    expect(out.imageAttributes).toEqual({ src: '/hero.png' });
    expect(out.css).toBe('.provisional{}');
    expect(enqueueDevCompressionMisses).toHaveBeenCalled();

    vi.stubEnv('MODE', originalMode);
  });

  test('forwards ctx with componentProps to buildImage', async () => {
    const originalMode = import.meta.env.MODE;
    vi.stubEnv('MODE', 'development');

    const configCtx = {
      settings: {},
      componentProps: { placeholder: 'dominantColor' },
    } as ImgProcContext;

    vi.mocked(runDevCacheProbe).mockResolvedValue({
      allHit: false,
      hits: [],
      misses: [{ variantProfileHash: 'p', variantFormat: 'webp', variantWidth: 800 }],
      variants: { webp: [] },
    });

    await resolveImageDevOutput({
      ctx: configCtx,
      options: { src: '/hero.png' },
    });

    expect(ImageSource.buildImage).toHaveBeenCalledWith({
      ctx: configCtx,
      asBackground: undefined,
      options: { src: '/hero.png' },
    });

    vi.stubEnv('MODE', originalMode);
  });

  test('picture and background helpers expose the same mode contract', async () => {
    const originalMode = import.meta.env.MODE;
    vi.stubEnv('MODE', 'production');

    const pictureSource = {
      prepare: vi.fn().mockResolvedValue(undefined),
      finalize: vi.fn().mockResolvedValue(undefined),
      spinner: { fail: vi.fn() },
      imageAttributes: { src: '/final.webp' },
      imageClassList: [],
      pictureAttributes: {},
      pictureClassList: [],
      sources: [],
      containerClassList: [],
      containerAttributes: {},
      css: '.final{}',
      links: null,
    } as never;

    const backgroundSource = {
      prepare: vi.fn().mockResolvedValue(undefined),
      finalize: vi.fn().mockResolvedValue(undefined),
      spinner: { fail: vi.fn() },
      pictureAttributes: { style: 'background-image:url(/final.webp)' },
      pictureClassList: [],
      css: '.final{}',
      links: null,
    } as never;

    const { PictureSource } = await import('../../api/PictureSource.js');
    const { BackgroundSource } = await import('../../api/BackgroundSource.js');
    vi.mocked(PictureSource.buildPicture).mockReturnValue(pictureSource);
    vi.mocked(BackgroundSource.buildBackground).mockReturnValue(backgroundSource);

    const pictureOut = await resolvePictureDevOutput({
      ctx,
      options: { src: '/hero.png' },
    });
    const backgroundOut = await resolveBackgroundDevOutput({
      ctx,
      options: { src: '/hero.png' },
    });

    expect(pictureOut.mode).toBe('build');
    expect(backgroundOut.mode).toBe('build');

    vi.stubEnv('MODE', originalMode);
  });
});
