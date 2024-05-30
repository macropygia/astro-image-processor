/// <reference types="astro/client" />

import { ImgProcContext } from "./types.js";

declare global {
  var imageProcessorContext: ImgProcContext;
}
