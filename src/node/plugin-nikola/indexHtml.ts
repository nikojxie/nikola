import { Plugin } from 'vite';
import { readFile } from 'fs/promises';
import { CLIENT_ENTRY_PATH, DEFAULT_TEMPLATE_PATH } from '../constants';

export function pluginIndexHtml(): Plugin {
  return {
    name: 'nikola:index-html',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module', src: `/@fs/${CLIENT_ENTRY_PATH}` },
            injectTo: 'body'
          }
        ]
      };
    },
    configureServer(server) {
      // 写回调函数中是为了不影响vite内置中间件的逻辑
      return () => {
        server.middlewares.use(async (req, res) => {
          //1. 读取 template.html 的内容
          let html = await readFile(DEFAULT_TEMPLATE_PATH, 'utf-8');
          // 热更
          html = await server.transformIndexHtml(
            req.url,
            html,
            req.originalUrl
          );
          //2. 响应 HTML 到浏览器
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        });
      };
    }
  };
}
