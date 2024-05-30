import { deterministicString } from "deterministic-object-hash";

import type { ImgProcHasher } from "../../types.js";

type DeterministicHash = (input: unknown, hasher: ImgProcHasher) => string;

export const deterministicHash: DeterministicHash = (input, hasher) =>
  hasher(deterministicString(input));
