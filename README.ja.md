# Astro Image Processor

[English](README.md) | **日本語**

画像の最適化とアートディレクションを行う静的ビルド専用[Astro](https://astro.build/)インテグレーション

**開発初期段階につき内部開発中・全ての仕様は破壊的変更の有無に関わらず予告なく変更される可能性あり**

## Overview

- `<img>` および `<picture>` 要素を前景または背景として出力
- 任意のコンテナ要素に対して `image-set()` を使用して `background-image` を設定
- 静的ビルド専用
    - SSR非対応（対応予定なし）
- [sharp](https://sharp.pixelplumbing.com/)に依存
    - 画像の編集にはsharpインスタンスを直接指定可能
- 重複の抑制と処理の高速化にフォーカス
- 独立した永続化キャッシュを搭載
- Links: [GitHub](https://github.com/macropygia/astro-image-processor) / [npm](https://www.npmjs.com/package/astro-image-processor) / [Documentation](https://macropygia.github.io/astro-image-processor/ja/)

## Documentation

詳しい情報は[公式ドキュメント](https://macropygia.github.io/astro-image-processor/ja/getting-started/)を参照

- 仕様・機能・特徴: [Introduction](https://macropygia.github.io/astro-image-processor/ja/getting-started/)
- 出力サンプル: [Sample Output](https://macropygia.github.io/astro-image-processor/ja/sample-output/)
- クイックスタートガイド: [Getting Started](https://macropygia.github.io/astro-image-processor/ja/getting-started/)

## プロダクション利用における留意事項

プロダクション用途では本インテグレーションとsharpのバージョンを固定することを強く推奨する。

これらの実装が変更された場合、画像の識別に使用されているハッシュが変更される可能性があり、ハッシュが変更されると全てのキャッシュのリビルドが必要になる。またHTMLの内容も変更される。

## Contributing

本リポジトリに提供するコードを `GitHub Copilot` で生成する場合、必ず `Suggestions matching public code` オプションを `Block` に設定すること。同様のオプションが存在する類似のサービスを使用する場合も同様。
