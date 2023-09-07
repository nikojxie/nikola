import { pluginIndexHtml } from './plugin-nikola/indexHtml';
import pluginReact from '@vitejs/plugin-react';
import { pluginConfig } from './plugin-nikola/config';
import { pluginRoutes } from './plugin-routes';
import { SiteConfig } from 'shared/types';
import { pluginMdx } from './plugin-mdx';

export async function createVitePlugins(
  config: SiteConfig,
  restartServer?: () => Promise<void>
) {
  return [
    pluginIndexHtml(),
    pluginReact({
      jsxRuntime: 'automatic'
    }),
    pluginConfig(config, restartServer),
    pluginRoutes({
      root: config.root
    }),
    await pluginMdx()
  ];
}
