import { afterEach, describe, expect, test, vi } from "vitest";

import type { ImgProcProcessorOptions } from "../../types.js";
import { generateComponentHash } from "./generateComponentHash.js";

describe("Unit/api/methods/generateSourceHash", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockOptions = {
    processor: ["mock-processor-1", "mock-processor-2"],
    profile: undefined,
    blurProcessor: "mock-blur-processor",
    artDirectives: [
      { processor: ["mock-art-processor-1"] },
      { processor: ["mock-art-processor-2"] },
    ],
    pictureAttributes: "mock-picture-attributes",
  } as unknown as Partial<ImgProcProcessorOptions>;

  const mockHasher = vi.fn().mockReturnValue("mockhash");

  vi.mock("../utils/getFilteredSharpOptions.js", () => ({
    getFilteredSharpOptions: vi.fn((str: string) => str),
  }));

  test("generateComponentHash should generate hash from options", () => {
    const hash = generateComponentHash(mockOptions, mockHasher);

    expect(hash).toBe("mockhash");
    expect(mockHasher).toHaveBeenLastCalledWith(expect.any(String));
  });

  test("handle processor option", () => {
    const options = {
      ...mockOptions,
      processor: ["mock-processor-1", "", null],
    } as unknown as Partial<ImgProcProcessorOptions>;
    generateComponentHash(options, mockHasher);

    expect(mockHasher).toHaveBeenLastCalledWith(
      expect.stringContaining("mock-processor-1"),
    );
  });

  test("handle profile option", () => {
    const options = { ...mockOptions, profile: "mock-profile" };
    generateComponentHash(options, mockHasher);

    expect(mockHasher).toHaveBeenLastCalledWith(
      expect.stringContaining("mock-profile"),
    );
  });

  test("handle blurProcessor option", () => {
    generateComponentHash(mockOptions, mockHasher);

    expect(mockHasher).toHaveBeenLastCalledWith(
      expect.stringContaining("mock-blur-processor"),
    );
  });

  test("handle artDirectives option", () => {
    generateComponentHash(mockOptions, mockHasher);

    expect(mockHasher).toHaveBeenLastCalledWith(
      expect.stringContaining("mockhash"),
    );
  });

  test("both profile and processor are undefined", () => {
    const options = {
      ...mockOptions,
      profile: undefined,
      processor: undefined,
    } as unknown as Partial<ImgProcProcessorOptions>;
    generateComponentHash(options, mockHasher);

    expect(mockHasher).toHaveBeenLastCalledWith(
      expect.stringContaining(`"profile":undefined`),
    );
  });
});
