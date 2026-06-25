/// <reference types="astro/client" />
/// <reference types="bun-types" />

import { ImgProcContext } from './types.js';

declare global {
  var imageProcessorContext: ImgProcContext;

  namespace App {
    interface Locals {
      __aipHead?: import('./integration/headStorage.js').AipHeadStorage;
    }
  }
}

export {};
