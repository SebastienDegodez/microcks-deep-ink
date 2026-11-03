# @microcks-deep-ink/registry

The single source of truth for copyable Deep Ink code. The CLI (`pnpm deep-ink add …`) and the Storybook Copy
panel read the JSON this package builds. DEMO, private, Apache-2.0.

```
items/<name>.json     metadata, accessibility contract (validated by registry.schema.json)
src/css/<name>.css    styles, wrapped in @layer deep-ink.components
src/react/<name>.tsx  React (siblings imported relatively, files land flat in the target)
src/angular/<name>.ts Angular (standalone components and attribute directives)
src/html/<name>.html  HTML recipe for plugins and vanilla use
```

Files are discovered by name: `^<name>(\.[a-z0-9-]+)*\.(tsx|ts|css|html)$`, excluding `*.spec.*` and `*.stories.*`.
`extraFiles` in the item JSON lists helpers that do not follow the rule. `cssOnly` marks `tokens` and `base`.

## Build

```bash
pnpm --filter @microcks-deep-ink/tokens build
pnpm --filter @microcks-deep-ink/registry build          # warnings for what is not written yet
pnpm build:strict                                          # from the root: warnings become errors (CI)
```

Outputs in `dist/`: `registry.json` (index), `registry.full.json` (with file contents and the tokens CSS),
`deep-ink-components.css` (base first, then every item in dependency order; Storybook only).
The build fails on an unknown dependency, a cycle, a missing CSS file or a schema error. Every copied file gets a header
(`// Deep Ink · <name>@0.2.0 · copied from packages/registry. You own this file.`).
Element items list `"elements": ["workflow-loom"]` (or `command-bar`, `plugin-slot`); `scripts/sync-elements.mjs` copies the self-contained bundles from `packages/core/dist/elements`.
`scripts/a11y-table.mjs` prints the component to RGAA table used by `docs/accessibility.md`.

Checks: `test` (Vitest + jsdom + axe-core), `typecheck` (tsc for React, ngc for Angular), `lint` (jsx-a11y strict, react-hooks, angular-eslint template a11y).
`test/setup.ts` unmounts after each test and polyfills `<dialog>` and `popover` for jsdom; `test/axe.ts` runs axe without color contrast (checked by the tokens test and the browser smoke run).

## CSS class API

One root class `<name>` on a native element. Variants are `data-*` attributes. State is native or ARIA
(`:disabled`, `[aria-invalid="true"]`, `[aria-selected="true"]`, `[aria-current="page"]`, `[aria-pressed="true"]`, `[aria-expanded="true"]`, `[aria-busy="true"]`).
CSS classes, React components and file names have no prefix. Only Angular uses a `mk` selector prefix (`<mk-tabs>`, `<button mkButton>`), because the Angular style guide and `@angular-eslint` require one for element and directive selectors.

### Layers and theming

`base.css` declares `@layer deep-ink.base, deep-ink.components;` and every component stylesheet is wrapped in
`@layer deep-ink.components { … }`. Tokens stay unlayered on `:root`. Unlayered CSS always beats layered CSS, so your
overrides win without `!important`:

```css
.button[data-variant="primary"] { border-radius: 999px; }   /* wins, no matter the specificity */
```

Theme with the tokens: `data-theme="dark" | "light"` on `<html>` and the custom properties of `tokens.css`
(`--action`, `--surface`, `--border-control`, `*-tint`, …). Never put text on an alpha or `color-mix` background; use the opaque `*-tint` tokens.
Reduced motion is an unlayered block in `base.css`, so no component can opt out of it.

### Base and helpers

| Class | Purpose |
|---|---|
| `.sr-only` | Visually hidden, still announced. Keeps a focusable input usable (clip pattern) |
| `.skip-link` | First focusable element; visible on focus; points at `#main` |
| `.stack` | Column, gap `--gap` |
| `.inline` | Wrapping row, gap `--gap` |
| `:focus-visible` | 2px `--action` outline, 2px offset, `--shadow-focus` |

### Natural items

| Item | Markup and hooks |
|---|---|
| `icon` | `svg.icon`; decorative = `aria-hidden`, informative = `role="img" aria-label` |
| `button` | `.button[data-variant=primary\|secondary\|ghost\|danger][data-size=md\|sm][data-confirm][data-icon-only]`; works on `<button>`, `<a>` and `<label>`; `aria-pressed="true"` and `aria-busy="true"` are styled |
| `copy-button` | `.button.copy-button` plus a sibling `role="status"` live region |
| `field` | `.field[data-invalid] > .label (.required) + control + .help + .error` |
| `input` | `input.input[data-mono][data-size]`, `textarea.input` |
| `select` | `select.select[data-size]` |
| `checkbox` | `.choice > input.checkbox / input.radio + span (.choice-label, .choice-description)`; `fieldset.fieldset > legend` |
| `switch` | `.choice > input[type=checkbox][role=switch].switch + span` |
| `tabs` | `.tabs > [role=tablist].tablist[aria-label] > button[role=tab].tab[aria-selected][aria-controls] > .tab-count`; `[role=tabpanel].tabpanel[tabindex=0]` |
| `chip` | `.chip[data-tone=neutral\|info\|success\|warning\|danger][data-variant=solid\|outline\|dashed]`, `.chip-key`, `.chip-remove`; `button.chip[aria-pressed]` for filters |
| `panel` | `.panel[data-flush] > .panel-header > .panel-title + .panel-actions`, `.panel-body` |
| `table` | `.table-wrap[role=region][tabindex=0] > table.table[data-density] > caption`; `th[scope=col][aria-sort]`; `td[data-align=end][data-mono]`; `.table-sort`, `.table-rowlink`, `.table-empty`; `tr[data-selected]` |
| `dialog` | `dialog.dialog[data-size] > .dialog-header (.dialog-title) / .dialog-body (.dialog-description) / .dialog-footer`; `::backdrop` |
| `menu` | `button.button[popovertarget][aria-expanded] + div.menu[popover] > .menu-item[data-tone=danger]` |
| `segmented` | `.segmented > button[aria-pressed] > .segmented-count` |

Content, layout and Microcks items (callout, code-block, skeleton, progress, kbd, link, disclosure, description-list,
empty-state, app-shell, theme-toggle, api-badge, method-tag, status-badge, live-indicator, conformance-band, mock-url,
operation-row, ai-ghost-row, drop-zone, step-status, run-target, run-origin) document their hooks in their
`src/html/<name>.html` recipe, and every item lists its keyboard model, ARIA and RGAA/WCAG references in `items/<name>.json` (`a11y`).

### React conventions

Components forward native props and `ref` (React 19 ref-as-prop) to the root native element and merge `className`.
Field controls take the props from `Field`'s render function: `{(control) => <Input {...control} />}`.
Dialog initial focus: `data-autofocus`, else the first control of the body or footer, else the close button.
Tabs: put `TabPanel`s in `Tabs`'s children (ids are shared through context) or pass the same `idPrefix` to both.
