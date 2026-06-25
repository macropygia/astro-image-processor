import sharp, { type Sharp, type SharpOptions } from 'sharp';

export const applySharpProfiles = async (
  buffer: Buffer,
  profiles: Record<string, unknown>[],
): Promise<Buffer> => {
  if (profiles.length === 0) {
    return buffer;
  }

  let pipeline: Sharp = sharp(buffer);
  for (const profile of profiles) {
    pipeline = pipeline.pipe(sharp(profile as SharpOptions));
  }
  return pipeline.toBuffer();
};
