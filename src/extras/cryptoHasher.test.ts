import crypto from "node:crypto";

import { describe, expect, test, vi } from "vitest";

import { cryptoHasher } from "./cryptoHasher.js";

describe("cryptoHasher", () => {
  const buffer = Buffer.from("test buffer");

  test("crypto.hash", () => {
    // Mock crypto.hash
    const mockHash = vi.fn(() => "mockedHash");
    (crypto as any).hash = mockHash;

    const result = cryptoHasher(buffer);

    expect(mockHash).toHaveBeenCalledWith("md5", buffer);
    expect(result).toBe("mockedHash");
  });

  test("crypto.createHash", () => {
    // Remove crypto.hash to simulate older Node.js version
    delete (crypto as any).hash;

    const mockCreateHash = vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "mockedHash"),
    }));
    (crypto as any).createHash = mockCreateHash;

    const result = cryptoHasher(buffer);

    expect(mockCreateHash).toHaveBeenCalledWith("md5");
    // expect(mockCreateHash().update).toHaveBeenCalledWith(buffer);
    // expect(mockCreateHash().digest).toHaveBeenCalledWith("hex");
    expect(result).toBe("mockedHash");
  });

  test("invalid crypto", () => {
    // Remove both hash and createHash to simulate an environment where neither is available
    delete (crypto as any).hash;
    delete (crypto as any).createHash;

    expect(() => cryptoHasher(buffer)).toThrow("File hash generation failed");
  });
});
