// Every parity case of packages/registry/parity: the Svelte component (from the barrel) must render the same
// normalised markup as React. Cases of a component not implemented in Svelte yet are todo.
import { describe, expect, it } from 'vitest';
import * as barrel from '../src/lib/index';
import { parity, parityItems } from './parity/parity';

const components = barrel as Record<string, unknown>;

for (const { item, component, cases } of parityItems()) {
  describe(`parity: ${item} (${component})`, () => {
    for (const c of cases) {
      const name = c.component ?? component;
      if (!(name in components)) it.todo(c.name);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else it(c.name, () => { const { svelte, react } = parity(components[name] as any, item, c); expect(svelte).toBe(react); });
    }
  });
}
