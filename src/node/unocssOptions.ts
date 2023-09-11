import { VitePluginConfig } from 'unocss/vite';
import { presetAttributify, presetWind, presetIcons } from 'unocss';

const options: VitePluginConfig = {
  presets: [presetAttributify(), presetWind({}), presetIcons()],
  rules: [
    [
      /^divider-(\w+)$/,
      ([, w]) => ({
        [`border-${w}`]: '1px solid var(--nikola-c-divider-light)'
      })
    ],
    [
      'menu-item-before',
      {
        'margin-right': '12px',
        'margin-left': '12px',
        width: '1px',
        height: '24px',
        'background-color': 'var(--nikola-c-divider-light)',
        content: '" "'
      }
    ]
  ],
  shortcuts: {
    'flex-center': 'flex justify-center items-center'
  },
  theme: {
    colors: {
      brandLight: 'var(--nikola-c-brand-light)',
      brandDark: 'var(--nikola-c-brand-dark)',
      brand: 'var(--nikola-c-brand)',
      text: {
        1: 'var(--nikola-c-text-1)',
        2: 'var(--nikola-c-text-2)',
        3: 'var(--nikola-c-text-3)',
        4: 'var(--nikola-c-text-4)'
      },
      divider: {
        default: 'var(--nikola-c-divider)',
        light: 'var(--nikola-c-divider-light)',
        dark: 'var(--nikola-c-divider-dark)'
      },
      gray: {
        light: {
          1: 'var(--nikola-c-gray-light-1)',
          2: 'var(--nikola-c-gray-light-2)',
          3: 'var(--nikola-c-gray-light-3)',
          4: 'var(--nikola-c-gray-light-4)'
        }
      },
      bg: {
        default: 'var(--nikola-c-bg)',
        soft: 'var(--nikola-c-bg-soft)',
        mute: 'var(--nikola-c-bg-mute)'
      }
    }
  }
};

export default options;
