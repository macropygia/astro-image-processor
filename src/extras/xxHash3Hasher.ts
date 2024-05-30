import xxhash from "xxhash-addon";

import type { ImgProcHasher } from "../types.js";

const { XXHash3 } = xxhash;

/**
 * File hasher using XXHash3
 * - Requires [xxhash-addon](https://www.npmjs.com/package/xxhash-addon)
 * @param buffer File buffer
 * @returns Hash string
 */
export const xxHash3Hasher: ImgProcHasher = (buffer) =>
  XXHash3.hash(
    typeof buffer === "string" ? Buffer.from(buffer) : buffer,
  ).toString("hex");
