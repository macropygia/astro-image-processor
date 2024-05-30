import fs from "node:fs";
import path from "node:path";

import { extByFormat } from "../../const.js";
import type { ImgProcFile } from "../../types.js";
import type { BaseSource } from "../BaseSource.js";
import { getMetadataFromBuffer } from "../utils/getMetadataFromBuffer.js";
import { normalizePath } from "../utils/normalizePath.js";
import { isOutputFormat } from "../utils/typeGuards.js";

type AddSource = (source: BaseSource) => Promise<void>;

/** Process new source */
export const addSource: AddSource = async (source) => {
  const {
    db,
    type,
    dirs,
    options: { placeholder, placeholderColor, processor },
    data,
  } = source;

  const buffer = await source.getBuffer();

  // Get metadata
  const metadata = await getMetadataFromBuffer({
    buffer,
    useDominant: placeholder === "dominantColor" && !placeholderColor,
    processor,
  });
  const { format: inputFormat } = metadata;

  Object.assign(data, { ...metadata });

  // Resolve downloadPath
  if (type === "remote") {
    const ext = isOutputFormat(inputFormat)
      ? extByFormat[inputFormat]
      : inputFormat;
    source.downloadPath = normalizePath(
      path.join(dirs.downloadDir, `${data.hash}.${ext}`),
    );

    // Save remote file cache
    fs.writeFileSync(source.downloadPath, buffer);
  }

  await db.insert(data as ImgProcFile);
};
