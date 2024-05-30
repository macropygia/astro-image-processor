import { describe, expect, test } from "vitest";

import { normalizePath } from "./normalizePath.js";

describe("Unit/api/utils/normalizePath", () => {
  test.each([
    {
      pathLike: "/foo/bar",
      trailingSlash: false,
      result: "/foo/bar",
    },
    {
      pathLike: "/foo/bar",
      trailingSlash: true,
      result: "/foo/bar/",
    },
    {
      pathLike: "/foo/bar/",
      trailingSlash: false,
      result: "/foo/bar/",
    },
    {
      pathLike: "/foo/bar/",
      trailingSlash: undefined,
      result: "/foo/bar/",
    },
    {
      pathLike: "/foo/bar",
      trailingSlash: undefined,
      result: "/foo/bar",
    },
    {
      pathLike: "c:\\foo\\bar",
      trailingSlash: undefined,
      result: "c:/foo/bar",
    },
    {
      pathLike: "foo\\bar//baz/",
      trailingSlash: undefined,
      result: "foo/bar/baz/",
    },
  ])("default", ({ pathLike, trailingSlash, result }) => {
    expect(normalizePath(pathLike, trailingSlash)).toBe(result);
  });
});
