import fs from "node:fs";

export async function pathExists(path: string) {
  try {
    await fs.promises.access(path);
    return true;
  } catch (_err: unknown) {
    return false;
  }
}
