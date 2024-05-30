import path from "node:path";

import type { ImgProcContextDirectories, ImgProcVariant } from "../../types.js";
import { normalizePath } from "./normalizePath.js";

type ResolvePathPattern = (args: {
  src: string;
  fileNamePattern: string;
  dirs: ImgProcContextDirectories;
  resolved: {
    width?: number;
    height?: number;
    widths?: [number, ...number[]];
    densities?: [number, ...number[]];
    sizes?: string;
  };
  item: ImgProcVariant;
}) => {
  from: string;
  to: string;
  toDir: string;
  toSrc: string;
};

export const resolvePathPattern: ResolvePathPattern = ({
  src,
  fileNamePattern,
  dirs,
  resolved,
  item,
}) => {
  const { rootDir, srcDir, outDir, imageCacheDir } = dirs;

  const from = normalizePath(
    path.join(imageCacheDir, `${item.hash}.${item.ext}`),
  );

  const srcPath = normalizePath(path.relative(srcDir, path.join(rootDir, src)));

  const srcParts = path.parse(srcPath);
  const toDir = normalizePath(path.join(outDir, srcParts.dir));
  const toFullname = fileNamePattern
    .replace("[name]", srcParts.name)
    .replace("[width]", `${resolved.width}`)
    .replace("[height]", `${resolved.height}`)
    .replace("[descriptor]", item.descriptor as string)
    .replace("[ext]", item.ext)
    .replace("[hash8]", item.hash.slice(0, 8))
    .replace("[hash]", item.hash);
  const toUrl = new URL(`file:///${toFullname}`);
  const toFilename = path.normalize(toUrl.pathname);
  const to = normalizePath(path.join(toDir, toFilename));
  const toSrc = `/${path.relative(outDir, to)}${toUrl.search}`;

  return {
    from,
    to,
    toDir,
    toSrc,
  };
};
