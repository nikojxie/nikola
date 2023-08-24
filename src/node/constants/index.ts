import { join } from 'path';

export const PACKAGE_ROOT = join(__dirname, '..');

export const CLIENT_ENTRY_PATH = join(
  PACKAGE_ROOT,
  'src',
  'runtime',
  'client-entry.tsx'
);

export const SERVER_ENTRY_PATH = join(
  PACKAGE_ROOT,
  'src',
  'runtime',
  'ssr-entry.tsx'
);

export const DEFAULT_TEMPLATE_PATH = join(PACKAGE_ROOT, 'template.html');
