import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

// biome-ignore lint/style/noDefaultExport: Required
export default defineConfig({
  site: "https://macropygia.github.io/astro-image-processor/",
  base: "/astro-image-processor/",
  integrations: [
    starlight({
      title: "Astro Image Processor",
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        ja: {
          label: "日本語",
        },
      },
      social: {
        github: "https://github.com/macropygia/astro-image-processor",
      },
      customCss: ["./src/styles/custom.css"],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../src/index.ts",
            "../src/types.ts",
            "../src/api/index.ts",
            "../src/components/exports.ts",
            // "../src/components/injectLink.ts",
            // "../src/components/injectStyle.ts",
            "../src/extras/index.ts",
            // "../src/integration/**/*.ts",
          ],
          tsconfig: "../tsconfig.json",
          typeDoc: {
            exclude: ["../**/*.test.ts", "../**/*.d.ts"],
          },
          sidebar: {
            label: "TypeDoc",
          },
        }),
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Introduction", link: "/" },
            { label: "Getting Started", link: "/getting-started/" },
            { label: "Sample Output", link: "/sample-output/" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Configuration", link: "/guides/configuration/" },
            {
              label: "Configuration Reference",
              link: "/guides/configuration-reference/",
            },
            {
              label: "Tips",
              link: "/guides/tips/",
            },
          ],
        },
        {
          label: "Component",
          items: [
            { label: "<Image />", link: "/component/image/" },
            { label: "<Picture />", link: "/component/picture/" },
            { label: "Art Directive", link: "/component/art-directive/" },
            { label: "<Background />", link: "/component/background/" },
            { label: "<GlobalStyles />", link: "/component/global-styles/" },
            // { label: "<InjectStyle />", link: "/component/inject-style/" },
            // { label: "<InjectLink />", link: "/component/inject-link/" },
            { label: "Custom Component", link: "/component/custom-component/" },
          ],
          // autogenerate: { directory: "component" },
        },
        {
          label: "Extras",
          items: [
            { label: "Data Adapter", link: "/extras/data-adapter/" },
            { label: "Hasher", link: "/extras/hasher/" },
          ],
        },
        {
          label: "API",
          items: [
            { label: "ImageSource", link: "/reference/image-source/" },
            { label: "PictureSource", link: "/reference/picture-source/" },
            {
              label: "BackgroundSource",
              link: "/reference/background-source/",
            },
            {
              label: "ArtDirectiveSource",
              link: "/reference/art-directive-source/",
            },
            { label: "BaseSource", link: "/reference/base-source/" },
          ],
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
