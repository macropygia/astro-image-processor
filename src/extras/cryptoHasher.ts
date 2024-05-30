import crypto from "node:crypto";

import type { ImgProcHasher } from "../types.js";

/**
 * File hasher using crypto
 * @param buffer File buffer or string
 * @returns Hash string
 * @see https://nodejs.org/docs/latest-v20.x/api/crypto.html#cryptohashalgorith-data-outputencoding
 */
export const cryptoHasher: ImgProcHasher = (buffer) => {
  // Node.js >= 20.12.0
  if ("hash" in crypto) {
    // @ts-ignore
    return crypto.hash("md5", buffer);
  }
  // Node.js < 20.12.0
  if ("createHash" in crypto) {
    // @ts-ignore
    return crypto.createHash("md5").update(buffer).digest("hex");
  }
  throw new Error("File hash generation failed");
};
