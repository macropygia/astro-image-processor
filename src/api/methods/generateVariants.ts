import type { ImgProcVariant, ImgProcVariants } from '../../types.js';
import type { BaseSource } from '../BaseSource.js';
import { listVariantDescriptors } from './listVariantDescriptors.js';
import { resolveVariantGeneration } from './resolveVariantGeneration.js';

type VariantEnqueueState = {
  variants: ImgProcVariants;
  tasks: Promise<void | ImgProcVariant>[];
};

const enqueueStateSym = Symbol.for('astro-image-processor.variantEnqueueState');
const sharedEnqueueStateBySourceHash = new Map<string, VariantEnqueueState>();

export const clearSharedVariantEnqueueState = () => {
  sharedEnqueueStateBySourceHash.clear();
};

const getEnqueueState = (source: BaseSource): VariantEnqueueState => {
  const state = (source as BaseSource & { [enqueueStateSym]?: VariantEnqueueState })[
    enqueueStateSym
  ];
  if (state) {
    return state;
  }

  const sourceHash = source.data.hash;
  if (sourceHash) {
    const shared = sharedEnqueueStateBySourceHash.get(sourceHash);
    if (shared) {
      return shared;
    }
  }

  throw new Error('Variants have not been enqueued');
};

export const enqueueVariants = async (source: BaseSource): Promise<void> => {
  const {
    data: { hash: sourceHash },
    options: { src, processor },
    resolved,
    settings: { hasher },
    logger,
    dirs: { imageCacheDir },
  } = source;

  if (!sourceHash) {
    throw new Error('Source hash does not exist');
  }

  if (!resolved.widths) {
    throw new Error('Widths unresolved');
  }

  const variants: ImgProcVariants = {};
  const formatsArray =
    source.componentType === 'img' ? [source.options.format] : source.options.formats;

  for (const variantFormat of formatsArray) {
    variants[variantFormat] = [];
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: Promise<void | ImgProcVariant> in tasks array
  const tasks: Promise<void | ImgProcVariant>[] = [];

  for (const descriptor of listVariantDescriptors(source)) {
    const generationTask = resolveVariantGeneration({
      source,
      sourceHash,
      variantProfileHash: descriptor.variantProfileHash,
      src,
      variantFormat: descriptor.variantFormat,
      variantFormatOptions: descriptor.variantFormatOptions,
      variantWidth: descriptor.variantWidth,
      variantDensity: descriptor.variantDensity,
      imageCacheDir,
      processor,
      hasher,
      logger,
    });
    tasks.push(generationTask);
  }

  const state: VariantEnqueueState = {
    variants,
    tasks,
  };

  (source as BaseSource & { [enqueueStateSym]: VariantEnqueueState })[enqueueStateSym] = state;
  sharedEnqueueStateBySourceHash.set(sourceHash, state);
};

export const awaitVariants = async (source: BaseSource): Promise<ImgProcVariants> => {
  const { variants, tasks } = getEnqueueState(source);

  const generatedItems = await Promise.all(tasks);
  for (const item of generatedItems) {
    if (!item) {
      continue;
    }
    variants[item.format]?.push(item);
  }

  let key: keyof ImgProcVariants;
  for (key in variants) {
    variants[key]?.sort((a, b) => a.width - b.width);
  }

  const sourceHash = source.data.hash;
  delete (source as BaseSource & { [enqueueStateSym]?: VariantEnqueueState })[enqueueStateSym];
  if (sourceHash) {
    sharedEnqueueStateBySourceHash.delete(sourceHash);
  }

  return variants;
};

type GenerateVariants = (source: BaseSource) => Promise<ImgProcVariants>;

export const generateVariants: GenerateVariants = async (source) => {
  await enqueueVariants(source);
  return awaitVariants(source);
};
