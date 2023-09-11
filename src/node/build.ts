import { InlineConfig, build as viteBuild } from 'vite';
import {
  CLIENT_ENTRY_PATH,
  SERVER_ENTRY_PATH,
  MASK_SPLITTER
} from './constants';
import path, { join, dirname } from 'path';
import type { RollupOutput } from 'rollup';
import fs from 'fs-extra';
import ora from 'ora';
import { SiteConfig } from 'shared/types';
import { createVitePlugins } from './vitePlugins';
import { Route } from './plugin-routes';
import { pathToFileURL } from 'url';
import { RenderResult } from '../runtime/ssr-entry';

export async function bundle(root: string, config: SiteConfig) {
  const resolveViteConfig = async (
    isServer: boolean
  ): Promise<InlineConfig> => {
    return {
      mode: 'production',
      root,
      plugins: await createVitePlugins(config, undefined, isServer),
      ssr: {
        // 防止 cjs 产物中 require ESM 的产物，因为 react-router-dom 的产物为 ESM 格式
        noExternal: ['react-router-dom', 'lodash-es']
      },
      build: {
        minify: false,
        ssr: isServer,
        outDir: isServer ? path.join(root, '.temp') : path.join(root, 'build'),
        rollupOptions: {
          input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
          output: {
            format: isServer ? 'cjs' : 'esm'
          }
        }
      }
    };
  };
  try {
    const spinner = ora();
    spinner.start('Building client + server bundles...');
    const [clientBundle, serverBundle] = await Promise.all([
      // client build
      viteBuild(await resolveViteConfig(false)),
      // server build
      viteBuild(await resolveViteConfig(true))
    ]);
    spinner.stop();
    return [clientBundle, serverBundle] as [RollupOutput, RollupOutput];
  } catch (e) {
    console.log(e);
  }
}

export async function renderPages(
  render: (url: string) => RenderResult,
  routes: Route[],
  root: string,
  clientBundle: RollupOutput
) {
  console.log('Rendering page in server side...');
  const clientChunk = clientBundle.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry
  );
  return Promise.all(
    routes.map(async (route) => {
      const routePath = route.path;
      const { appHtml, nikolaToPathMap, propsData } = await render(routePath);
      await buildNikolas(root, nikolaToPathMap);
      const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>title</title>
    <meta name="description" content="xxx">
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module" src="/${clientChunk?.fileName}"></script>
  </body>
</html>`.trim();
      const fileName = routePath.endsWith('/')
        ? `${routePath}index.html`
        : `${routePath}.html`;
      await fs.ensureDir(join(root, 'build', dirname(fileName)));
      await fs.writeFile(join(root, 'build', fileName), html);
    })
  );
}

async function buildNikolas(
  root: string,
  nikolaPathToMap: Record<string, string>
) {
  // 根据 nikolaPathToMap 拼接模块代码内容
  const nikolasInjectCode = `
    ${Object.entries(nikolaPathToMap)
      .map(
        ([nikolaName, nikolaPath]) =>
          `import { ${nikolaName} } from '${nikolaPath}';`
      )
      .join('')}
window.NIKOLAS = { ${Object.keys(nikolaPathToMap).join(', ')} };
window.NIKOLA_PROPS = JSON.parse(
  document.getElementById('nikola-props').textContent
);
  `;
  const injectId = 'nikola:inject';
  return viteBuild({
    mode: 'production',
    build: {
      // 输出目录
      outDir: path.join(root, '.temp'),
      rollupOptions: {
        input: injectId
      }
    },
    plugins: [
      // 重点插件，用来加载拼接的 Nikolas 注册模块的代码
      {
        name: 'nikola:inject',
        enforce: 'post',
        resolveId(id) {
          if (id.includes(MASK_SPLITTER)) {
            const [originId, importer] = id.split(MASK_SPLITTER);
            return this.resolve(originId, importer, { skipSelf: true });
          }

          if (id === injectId) {
            return id;
          }
        },
        load(id) {
          if (id === injectId) {
            return nikolasInjectCode;
          }
        },
        // 对于 Nikolas Bundle，只需要 JS 即可，其它资源文件可以删除
        generateBundle(_, bundle) {
          for (const name in bundle) {
            if (bundle[name].type === 'asset') {
              delete bundle[name];
            }
          }
        }
      }
    ]
  });
}

export async function build(root: string = process.cwd(), config: SiteConfig) {
  // 1. bundle - client 端 + server 端
  const [clientBundle] = await bundle(root, config);
  // 2. 引入 server-entry 模块
  const serverEntryPath = join(root, '.temp', 'ssr-entry.js');
  const { render, routes } = await import(
    pathToFileURL(serverEntryPath).toString()
  );
  // 3. 服务端渲染，产出 HTML
  try {
    await renderPages(render, routes, root, clientBundle);
  } catch (e) {
    console.log('Render page error.\n', e);
  }
}
