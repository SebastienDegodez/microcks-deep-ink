# Parity fixtures (React ↔ Svelte)

`<item>.cases.json` lists render cases of one registry item; `<item>.<case>.html` is the React markup of each case.

```json
{ "component": "Kbd", "cases": [{ "name": "default", "props": { "className": "x" }, "children": "K" }] }
```

- `component`: the export name (the same in React and Svelte); `props`: JSON props (React names, `className`);
  `children`: optional text child.
- The `.html` files are generated, never edited: `pnpm -C react/packages/deep-ink parity` renders every case with
  `renderToStaticMarkup`. `pnpm -C react test` fails when a file is stale or orphaned.
- `pnpm -C svelte test` renders the same cases with `svelte/server` and compares both after normalisation
  (attribute and class order, whitespace, comments, generated ids: `svelte/packages/deep-ink/test/parity/normalise.ts`).
  Cases of a component not yet implemented in Svelte are reported as todo.
