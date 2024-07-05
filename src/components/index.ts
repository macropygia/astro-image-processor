// @ts-ignore
import Background from "./Background.astro";
// @ts-ignore
import GlobalStyles from "./GlobalStyles.astro";
// @ts-ignore
import Image from "./Image.astro";
// @ts-ignore
import Picture from "./Picture.astro";

import { injectLink } from "./injectLink.js";
import { injectStyle } from "./injectStyle.js";

const StaticBackground = Background;
const StaticImage = Image;
const StaticPicture = Picture;

export {
  Background,
  GlobalStyles,
  Image,
  Picture,
  StaticBackground,
  StaticImage,
  StaticPicture,
  injectLink,
  injectStyle,
};
