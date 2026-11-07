# Parity fixtures (React ↔ Svelte)

`<item>.cases.json` lists render cases of one registry item; `<item>.<case>.html` is the React markup of each case.

```json
{ "component": "Kbd", "cases": [{ "name": "default", "props": { "className": "x" }, "children": "K" }] }
```

- `component`: the export name (the same in React and Svelte); a case may set its own `component` for another
  export of the same item (`Textarea` in `input.cases.json`); `props`: JSON props (React names, `className`);
  `children`: optional text child; a function prop is written `{ "$fn": "tone" }`, read as `(x) => x.tone`
  (`rowTone`, `rowHref`: put the value on each row); a `style` prop is React's object of string values
  (`{ "--split-gap": "8px", "marginTop": "4px" }`), given to Svelte as the string `--split-gap:8px;margin-top:4px`; `options`: `<option>` children instead (`[{ "label": "25", "value": "25", "disabled": true }]`,
  `value` and `disabled` optional); `control`: render-prop child instead (Field), an export of the package given the
  control props merged with its own `props` (`{ "component": "Input", "props": { "defaultValue": "x" } }`).
- The `.html` files are generated, never edited: `pnpm -C react/packages/deep-ink parity` renders every case with
  `renderToStaticMarkup`. `pnpm -C react test` fails when a file is stale or orphaned.
- `pnpm -C svelte test` renders the same cases with `svelte/server` and compares both after normalisation
  (attribute and class order, comments, generated ids: `svelte/packages/deep-ink/test/parity/normalise.ts`).
  Only formatting whitespace is ignored: runs collapse to one space and whitespace at block edges or between blocks
  drops, but a space inside text or between inline siblings (`<label>a</label> <span>b</span>`) must match, and
  `<pre>`/`<code>`/`<textarea>` text must match exactly. The rule is documented at the top of `normalise.ts`.
  Cases of a component not yet implemented in Svelte are reported as todo.
