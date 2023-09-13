import { InlineConfig, build as viteBuild } from 'vite';
import {
  CLIENT_ENTRY_PATH,
  SERVER_ENTRY_PATH,
  MASK_SPLITTER,
  EXTERNALS,
  PACKAGE_ROOT
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
import { HelmetData } from 'react-helmet-async';

const CLIENT_OUTPUT = 'build';

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
        outDir: isServer
          ? path.join(root, '.temp')
          : path.join(root, CLIENT_OUTPUT),
        rollupOptions: {
          input: isServer ? SERVER_ENTRY_PATH : CLIENT_ENTRY_PATH,
          output: {
            format: isServer ? 'cjs' : 'esm'
          },
          external: EXTERNALS
        }
      }
    };
  };
  try {
    // const spinner = ora();
    // spinner.start('Building client + server bundles...');
    const [clientBundle, serverBundle] = await Promise.all([
      // client build
      viteBuild(await resolveViteConfig(false)),
      // server build
      viteBuild(await resolveViteConfig(true))
    ]);
    const publicDir = join(root, 'public');
    if (fs.pathExistsSync(publicDir)) {
      await fs.copy(publicDir, join(root, CLIENT_OUTPUT));
    }
    try {
      await fs.copy(join(PACKAGE_ROOT, 'vendors'), join(root, CLIENT_OUTPUT));
      return [clientBundle, serverBundle] as [RollupOutput, RollupOutput];
    } catch (e) {
      console.log(e);
    }
    // spinner.stop();
  } catch (e) {
    console.log(e);
  }
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
          `import { ${nikolaName} } from '${nikolaPath}'`
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
    esbuild: {
      jsx: 'automatic'
    },
    build: {
      // 输出目录
      outDir: path.join(root, '.temp'),
      rollupOptions: {
        input: injectId,
        external: EXTERNALS
      }
    },
    plugins: [
      {
        name: 'nikola-inject',
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

export async function renderPages(
  render: (url: string, helmetContext: object) => RenderResult,
  routes: Route[],
  root: string,
  clientBundle: RollupOutput
) {
  console.log('Rendering page in server side...');
  const clientChunk = clientBundle.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry
  );
  return Promise.all(
    [
      ...routes,
      {
        path: '/404'
      }
    ].map(async (route) => {
      const routePath = route.path;
      const helmetContext = {
        context: {}
      } as HelmetData;
      const {
        appHtml,
        nikolaToPathMap,
        nikolaProps = []
      } = await render(routePath, helmetContext.context);
      const styleAssets = clientBundle.output.filter(
        (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css')
      );
      const nikolaBundle = await buildNikolas(root, nikolaToPathMap);
      const nikolasCode = (nikolaBundle as RollupOutput).output[0].code;
      const { helmet } = helmetContext.context;
      const normalizeVendorFilename = (fileName: string) =>
        fileName.replace(/\//g, '_') + '.js';
      const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    ${helmet?.title?.toString() || ''}
    ${helmet?.meta?.toString() || ''}
    ${helmet?.link?.toString() || ''}
    ${helmet?.style?.toString() || ''}
    <meta name="description" content="xxx">
    ${styleAssets
      .map((item) => `<link rel="stylesheet" href="/${item.fileName}">`)
      .join('\n')}
    <script type="importmap">
      {
        "imports": {
          ${EXTERNALS.map(
            (name) => `"${name}": "/${normalizeVendorFilename(name)}"`
          ).join(',')}
        }
      }
    </script>
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script type="module">${nikolasCode}</script>
    <script type="module" src="/${clientChunk?.fileName}"></script>
    <script id="nikola-props">${JSON.stringify(nikolaProps)}</script>
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
