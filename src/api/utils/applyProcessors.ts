import sharp, { type Sharp } from "sharp";

type ApplyProcessors = (args: {
  processors: (sharp.Sharp | sharp.Sharp[] | undefined)[];
  buffer: Buffer;
}) => Sharp;

export const applyProcessors: ApplyProcessors = ({ processors, buffer }) =>
  // NOTE: Typescript issue
  (processors.flat().filter(Boolean) as sharp.Sharp[]).reduce(
    (prevStream, currentStream) => prevStream.pipe(currentStream.clone()),
    sharp(buffer),
  );
