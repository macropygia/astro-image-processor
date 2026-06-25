import type { BaseSource } from '../BaseSource.js';
import { deterministicHash } from '../utils/deterministicHash.js';
import { getFilteredSharpOptions } from '../utils/getFilteredSharpOptions.js';

export const resolveBlurPlaceholderProfile = (source: BaseSource): string =>
  deterministicHash(
    [source.profile, getFilteredSharpOptions(source.options.blurProcessor)].flat().filter(Boolean),
    source.settings.hasher,
  );
