---
title: Sample Output
# description:
---

```astro
---
// src/pages/index.astro
import GlobalStyles from 'astro-image-processor/components/GlobalStyles.astro';
import Picture from 'astro-image-processor/components/Picture.astro';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Astro Image Processor</title>
  </head>
  <body>
    <h1>Astro Image Processor</h1>
    <Picture
      src="/src/assets/3000_gray.png"
      alt="Astro Image Processor"
      preload="avif"
      width={1000}
      widths={[1000, 2000, 3000]}
      placeholder="blurred"
      blurProcessor={sharp().grayscale().resize(20).webp({ quality: 1 })}
      artDirectives={[
        {
          src: '/src/assets/3000_gray.png',
          densities: [1, 2, 3],
          width: 500,
          media: '(max-width: 520px)',
          processor: sharp().resize(2000, 3000),
          placeholder: 'dominantColor',
          placeholderColor: '#666',
          preload: 'avif',
        },
      ]}
      tagName="section"
      containerAttributes={{
        'class:list': ['foo', 'bar'],
      }}
    >
      <p class="baz">slot</p>
    </Picture>
  </body>
</html>

<style>
  .foo {
    position: relative;
  }
  .bar {
    padding: 20px;
  }
  .baz {
    color: red;
  }
</style>

<GlobalStyles />
```

```html
<!-- dist/index.html -->
<!DOCTYPE html>
<html lang="en" data-astro-cid-j7pv25f6>

<head>
  <meta charset="utf-8">
  <title>Astro Image Processor</title>
  <style>
    @keyframes aip-placeholder-fade {
      0% {
        opacity: 1
      }
      to {
        opacity: 0
      }
    }
    :root {
      --aip-placeholder-animation-name: aip-placeholder-hidden
    }
    :where(.aip-elm-img) {
      display: inline-block;
      overflow: clip;
      vertical-align: middle;
      background-repeat: no-repeat
    }
    :where(.aip-elm-picture) {
      display: inline-block;
      position: relative;
      --aip-placeholder-animation-state: paused;
      background-repeat: no-repeat
    }
    :where(.aip-elm-picture):after {
      display: block;
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      animation-name: var(--aip-placeholder-animation-name);
      animation-duration: 1s;
      animation-fill-mode: forwards;
      animation-timing-function: ease;
      animation-play-state: var(--aip-placeholder-animation-state);
      background-repeat: no-repeat
    }
    :where(.aip-elm-container) {
      position: relative;
      background-repeat: no-repeat
    }
    :where(.aip-elm-as-background) {
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      max-width: unset
    }
    :where(.aip-elm-img.aip-layout-constrained) {
      max-width: 100%;
      height: auto
    }
    :where(.aip-elm-picture.aip-layout-fullWidth) {
      width: 100%;
      height: auto
    }
    :where(.aip-elm-img.aip-layout-fullWidth) {
      width: 100%;
      height: auto
    }
    :where(.aip-elm-picture.aip-layout-fill) {
      width: 100%;
      height: 100%
    }
    :where(.aip-elm-img.aip-layout-fill) {
      width: 100%;
      height: 100%
    }
    .foo[data-astro-cid-j7pv25f6] {
      position: relative
    }
    .bar[data-astro-cid-j7pv25f6] {
      padding: 20px
    }
    .baz[data-astro-cid-j7pv25f6] {
      color: red
    }
  </style>
  <script type="module">
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.setProperty(
        "--aip-placeholder-animation-name",
        "aip-placeholder-fade")
    });
  </script>
  <style>
    img[data-astro-aip-8c2980cb] {
      background-size: cover;
      background-position: 50% 50%;
      background-image: var(--aip-blurred-image);
      object-fit: cover
    }
    picture[data-astro-aip-8c2980cb] {
      --aip-blurred-image: url("data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAADwAgCdASoUABQAP83k620/uTGpqAgD8DmJaQAASybQAACDFgAAAA==")
    }
    picture[data-astro-aip-8c2980cb]::after {
      background-image: var(--aip-blurred-image);
      background-size: cover;
      background-position: 50% 50%
    }
    div[data-astro-aip-8c2980cb] {
      width: 1000px
    }
    @media(max-width: 520px) {
      picture[data-astro-aip-8c2980cb]::after {
        background-color: #666
      }
      img[data-astro-aip-8c2980cb] {
        object-fit: cover
      }
    }
  </style>
  <link rel="preload"
        as="image"
        type="image/avif"
        imagesizes="(min-width: 1000px) 1000px, 100vw"
        imagesrcset="/_astro/2ad8685b6d73025dffd70bf08466f373.avif 1000w, /_astro/aa42252dc6734f14964142129aa1b06d.avif 2000w, /_astro/1551a2a6d6b041900edc69d9ad48fe9f.avif 3000w">
  <link rel="preload"
        as="image"
        type="image/avif"
        media="(max-width: 520px)"
        imagesizes="(min-width: 500px) 500px, 100vw"
        imagesrcset="/_astro/2ceecec44530035558df5f8ec2237e5f.avif 1x, /_astro/048e32e5f5c9e6d42a48475d6c2a0af0.avif 2x, /_astro/bd62f7eafb0763d192263b34f7859cfb.avif 3x">
</head>

<body data-astro-cid-j7pv25f6>
  <h1 data-astro-cid-j7pv25f6>Astro Image Processor</h1>
  <section data-astro-aip-8c2980cb data-astro-cid-j7pv25f6 class="foo bar">
    <picture class="aip-elm-picture aip-elm-as-background aip-layout-constrained"
             data-astro-aip-8c2980cb
             data-astro-cid-j7pv25f6>
      <source srcset="/_astro/2ceecec44530035558df5f8ec2237e5f.avif 1x, /_astro/048e32e5f5c9e6d42a48475d6c2a0af0.avif 2x, /_astro/bd62f7eafb0763d192263b34f7859cfb.avif 3x"
              sizes="(min-width: 1000px) 1000px, 100vw"
              width="500"
              height="750"
              type="image/avif"
              media="(max-width: 520px)">
      <source srcset="/_astro/07f6bb01ab3f760ea6faad794bb8a5f7.webp 1x, /_astro/e6a6fdcaa5fc61af7b376c43ec26f215.webp 2x, /_astro/7d8d7ddb37aa5cecceb301999108e4d6.webp 3x"
              sizes="(min-width: 1000px) 1000px, 100vw"
              width="500"
              height="750"
              type="image/webp"
              media="(max-width: 520px)">
      <source srcset="/_astro/2ad8685b6d73025dffd70bf08466f373.avif 1000w, /_astro/aa42252dc6734f14964142129aa1b06d.avif 2000w, /_astro/1551a2a6d6b041900edc69d9ad48fe9f.avif 3000w"
              sizes="(min-width: 1000px) 1000px, 100vw"
              width="1000"
              height="1000"
              type="image/avif">
      <img class="aip-elm-img aip-elm-as-background"
           alt="Astro Image Processor"
           data-astro-cid-j7pv25f6
           src="/_astro/beeafc331857b458e1cada00de1b665f.webp"
           srcset="/_astro/beeafc331857b458e1cada00de1b665f.webp 1000w, /_astro/ddbe42c7b4ba4c7600c38725c428cec1.webp 2000w, /_astro/fb8791adb4f611296f4f445eacab4934.webp 3000w"
           width="1000"
           height="1000"
           sizes="(min-width: 1000px) 1000px, 100vw"
           data-astro-aip-8c2980cb
           onload="parentElement.style.setProperty('--aip-placeholder-animation-state', 'running');">
    </picture>
    <p class="baz" data-astro-cid-j7pv25f6>slot</p>
  </section>
</body>

</html>
```
