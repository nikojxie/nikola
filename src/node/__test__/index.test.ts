import { expect, test } from 'vitest';

test('add', () => {
  expect('map'.slice(1)).toMatchInlineSnapshot('"ap"');
});
