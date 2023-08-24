import { createServer } from 'vite';
import { pluginIndexHtml } from './plugin-nikola/indexHtml';
import pluginReact from '@vitejs/plugin-react';

export function createDevServer(root: string) {
  return createServer({
    root,
    plugins: [pluginIndexHtml(), pluginReact()]
  });
}
