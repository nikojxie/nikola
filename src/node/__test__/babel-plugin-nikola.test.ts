import { expect, describe, test } from 'vitest';
import babelPluginNikola from '../babel-plugin-nikola';
import { TransformOptions, transformAsync } from '@babel/core';
import os from 'os';
import { MASK_SPLITTER } from '../constants';

const isWindows = os.platform() === 'win32';

describe('babel-plugin-nikola', () => {
  // import Aside from '../Comp/index';
  const NIKOLA_PATH = '../Comp/index';
  const prefix = isWindows ? 'C:' : '';
  const IMPORTER_PATH = prefix + '/User/project/test.tsx';
  const babelOptions: TransformOptions = {
    filename: IMPORTER_PATH,
    presets: ['@babel/preset-react'],
    plugins: [babelPluginNikola]
  };

  test('Should compile jsx identifier', async () => {
    const code = `import Aside from '${NIKOLA_PATH}'; export default function App() { return <Aside __nikola />; }`;

    const result = await transformAsync(code, babelOptions);

    expect(result?.code).toContain(
      `__nikola: "${NIKOLA_PATH}${MASK_SPLITTER}${IMPORTER_PATH}"`
    );
  });

  test('Should compile jsx member expression', async () => {
    const code = `import A from '${NIKOLA_PATH}'; export default function App() { return <A.B __nikola />; }`;

    const result = await transformAsync(code, babelOptions);

    expect(result?.code).toContain(
      `__nikola: "${NIKOLA_PATH}${MASK_SPLITTER}${IMPORTER_PATH}"`
    );
  });
});
