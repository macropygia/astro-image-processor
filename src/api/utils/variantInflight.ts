import type { ImgProcVariant } from '../../types.js';

const inflightVariants = new Map<string, Promise<ImgProcVariant>>();

export const variantInflightKey = (sourceHash: string, variantProfileHash: string) =>
  `${sourceHash}\0${variantProfileHash}`;

export const getInflightVariant = (sourceHash: string, variantProfileHash: string) =>
  inflightVariants.get(variantInflightKey(sourceHash, variantProfileHash));

export const getOrCreateInflightVariant = (
  sourceHash: string,
  variantProfileHash: string,
  create: () => Promise<ImgProcVariant>,
) => {
  const key = variantInflightKey(sourceHash, variantProfileHash);
  const existing = inflightVariants.get(key);
  if (existing) {
    return existing;
  }

  const task = create();
  inflightVariants.set(key, task);
  void task.finally(() => {
    if (inflightVariants.get(key) === task) {
      inflightVariants.delete(key);
    }
  });
  return task;
};

export const trackInflightVariant = (
  sourceHash: string,
  variantProfileHash: string,
  task: Promise<ImgProcVariant>,
) => getOrCreateInflightVariant(sourceHash, variantProfileHash, () => task);

export const clearInflightVariants = () => {
  inflightVariants.clear();
};

export const resetInflightVariantsForTests = clearInflightVariants;
