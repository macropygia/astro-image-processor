import type { ImgProcCssObj } from "../../types.js";

type ParseCssObj = (args: {
  componentHash: string;
  scopedStyleStrategy: "attribute" | "class" | "where";
  styles: (ImgProcCssObj | undefined)[];
}) => string;

export const parseCssObj: ParseCssObj = ({
  componentHash,
  scopedStyleStrategy,
  styles,
}) => {
  const scope =
    scopedStyleStrategy === "attribute"
      ? `[data-astro-aip-${componentHash}]`
      : scopedStyleStrategy === "class"
        ? `.astro-aip-${componentHash}`
        : `:where(.astro-aip-${componentHash})`;
  const css = (styles.filter(Boolean) as ImgProcCssObj[]).reduce(
    (css, style) => {
      // Wrap with selector
      const innerCss = Object.entries(style.selectors).reduce(
        (css, [selector, props]) =>
          `${css}${selector.replace("[scope]", scope)}{${(
            props.filter(Boolean) as [string, string][]
          ) // NOTE: TypeScript issue
            .map((prop) => prop.join(":"))
            .join(";")}}`,
        "",
      );
      if (style.media) {
        // Wrap with media-query
        return `${css}@media${style.media}{${innerCss}}`;
      }
      return `${css}${innerCss}`;
    },
    "",
  );
  return css.replaceAll(";}", "}");
};

/*
scopedStyleStrategy === "attribute"
<img data-astro-cid-j7pv25f6 ... />
img[data-astro-cid-j7pv25f6] { ... }

scopedStyleStrategy === "class"
<img class="astro-j7pv25f6" ... />
img.astro-j7pv25f6 { ... }

scopedStyleStrategy === "where"
<img class="astro-j7pv25f6" ... />
img:where(.astro-j7pv25f6) { ... }
*/
