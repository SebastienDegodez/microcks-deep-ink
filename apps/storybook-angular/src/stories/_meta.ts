// Shared helper for the story metas. Every meta declares what the Copy panel shows
// (`parameters.deepInk.items`) and documents keyboard + ARIA from the registry (`a11yDoc`).
import { a11yDoc } from '../../../shared/copy-panel/a11y-doc';
import { REGISTRY_INPUTS } from './_argtypes.generated';

/**
 * Parameters shared by every story file: what the Copy panel shows (`deepInk.items`) and the keyboard + ARIA
 * documentation taken from the registry. Used as `parameters: itemParams([...])`.
 */
export function itemParams(items: string[], intro?: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    deepInk: { items },
    docs: { description: { component: [intro, a11yDoc(items[0])].filter(Boolean).join('\n\n') } },
    ...extra,
  };
}

/**
 * `argTypes` for a story meta, generated from the registry inputs (`pnpm --filter storybook-angular gen:argtypes`).
 * Angular Storybook has no compodoc here, so this is what fills the docs table. `classes` limits it to the
 * components and directives the story file uses. Without `controls` the table is documentation only: the fixed
 * `render()` stories do not read args. The `Playground` stories pass `controls: true`.
 */
export function argTypesFor(item: string, classes?: string[], controls = false): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const c of REGISTRY_INPUTS[item] ?? []) {
    if (classes && !classes.includes(c.className)) continue;
    for (const i of c.inputs) {
      if (out[i.name]) continue;
      const control =
        !controls ? false
        : i.control === 'select' ? { type: 'select' }
        : { type: i.control };
      out[i.name] = {
        description: i.description || undefined,
        ...(i.options ? { options: i.options } : {}),
        control,
        table: { type: { summary: i.type }, defaultValue: i.default ? { summary: i.default } : undefined, category: c.selector },
        type: { required: i.required },
      };
    }
  }
  return out;
}
