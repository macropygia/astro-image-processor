import path from "node:path";

/**
 * Replaces backslashes to slash and normalize
 * - If `trailingSlash` is set to `true`, trailing slash is added.
 * - If `trailingSlash` is set to `false`, removes trailing slash.
 * - If `trailingSlash` is not set, do nothing.
 * @param pathLike String
 * @param trailingSlash Boolean
 * @returns Path
 */
export const normalizePath = (
  pathLike: string,
  trailingSlash?: boolean,
): string => {
  let newPath = pathLike.replaceAll("\\", "/");
  if (trailingSlash === true) {
    newPath = `${newPath}/`;
  } else if (trailingSlash === false) {
    newPath.replace(/\/+$/, "");
  }
  return path.posix.normalize(newPath);
};
