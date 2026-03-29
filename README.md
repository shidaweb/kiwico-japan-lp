# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Cloudflare（本番デプロイ）

`@astrojs/cloudflare` 利用時は、`dist/` 直下を静的ホストするだけでは **`dist/client/_astro/*.css` が配信されず**、見た目が崩れます（`/_astro/*.css` が 404）。

次のいずれかで **Worker と静的アセットを一体デプロイ**してください。

1. **CLI（推奨）**  
   `npm run deploy`  
   （内部で `astro build` のあと `wrangler deploy --config dist/server/wrangler.json` を実行）

2. **Cloudflare Dashboard（Git 連携）**  
   [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) 等で、ビルド後に上記と同じ `wrangler deploy --config dist/server/wrangler.json` を実行するよう設定する。  
   従来の Pages だけで「ビルド出力ディレクトリ = `dist`」とする方式は、この構成では不十分です。

詳細は [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) を参照してください。

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
