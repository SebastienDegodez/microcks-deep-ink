import { expect, it } from 'vitest';
import { readPaths, registryPaths } from '../scripts/build-icons.mjs';
import { ICON_PATHS } from '../src/lib/internal/icon-data.js';

it('generates all glyphs from registry source literals without runtime framework imports', () => {
  expect(ICON_PATHS).toEqual(registryPaths());
  expect(Object.keys(ICON_PATHS)).toHaveLength(105);
});

it('rejects executable data instead of evaluating registry source', () => {
  expect(() => readPaths('const PATHS = { circle: execute() };')).toThrow('only string');
  expect(() => readPaths('const PATHS = { ...other };')).toThrow('Only literal');
});
