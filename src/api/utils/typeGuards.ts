import { extByFormat } from "../../const.js";
import type { ImgProcOutputFormat } from "../../types.js";

export function isFirstElementNumber(
  arr: unknown[],
): arr is [number, ...number[]] {
  if (typeof arr[0] === "number") {
    return true;
  }
  return false;
}

export function isOutputFormat(
  inputFormat: string,
): inputFormat is ImgProcOutputFormat {
  if ((inputFormat as ImgProcOutputFormat) in extByFormat) {
    return true;
  }
  return false;
}
