import type { ImgProcCssObj } from "../../types.js";

export class CssObjBuilder {
  private selectors: Record<string, ([string, string] | undefined)[]> = {};
  private media?: string;

  constructor(media?: string) {
    if (media) {
      this.media = media;
    }
  }

  public add(selector: string, ...styles: ([string, string] | undefined)[]) {
    if (!this.selectors[selector]) {
      this.selectors[selector] = [];
    }
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    this.selectors[selector] = this.selectors[selector]!.concat(
      styles.filter(Boolean),
    );
  }

  public get value(): ImgProcCssObj | undefined {
    if (Object.keys(this.selectors).length === 0) {
      return undefined;
    }

    const result: ImgProcCssObj = {
      selectors: this.selectors,
    };
    if (this.media) {
      result.media = this.media;
    }
    return result;
  }
}
