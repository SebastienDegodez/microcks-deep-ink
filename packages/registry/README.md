# @microcks-deep-ink/registry

The single source of truth for copyable Deep Ink code. The CLI (`pnpm deep-ink add …`) and the Storybook Copy
panel read the JSON this package builds. DEMO, private, Apache-2.0.

```
items/<name>.json     metadata, accessibility contract (validated by registry.schema.json)
src/css/<name>.css    styles, wrapped in @layer deep-ink.components
src/react/<name>.tsx  React (siblings imported relatively, files land flat in the target)
src/angular/<name>.ts Angular (written in phase 2)
src/html/<name>.html  HTML recipe for plugins and vanilla use
```

Files are discovered by name: `^<name>(\.[a-z0-9-]+)*\.(tsx|ts|css|html)$`, excluding `*.spec.*` and `*.stories.*`.
`extraFiles` in the item JSON lists helpers that do not follow the rule. `cssOnly` marks `tokens` and `base`.

## Build

```bash
pnpm --filter @microcks-deep-ink/tokens build
pnpm --filter @microcks-deep-ink/registry build          # warnings for what is not written yet
pnpm --filter @microcks-deep-ink/registry exec node scripts/build.mjs --strict   # phase 3: warnings become errors
```

Outputs in `dist/`: `registry.json` (index), `registry.full.json` (with file contents and the tokens CSS),
`deep-ink-components.css` (base first, then every item in dependency order; Storybook only).
The build fails on an unknown dependency, a cycle, a missing CSS file or a schema error. Every copied file gets a header
(`// Deep Ink · <name>@0.2.0 · copied from packages/registry. You own this file.`).
Element items list `"elements": ["mk-…"]`; `scripts/sync-elements.mjs` copies the bundles from `packages/core/dist/elements`.

Checks: `test` (Vitest + jsdom + axe-core), `typecheck` (tsc for React, ngc for Angular), `lint` (jsx-a11y strict, react-hooks, angular-eslint template a11y).
`test/setup.ts` unmounts after each test and polyfills `<dialog>` and `popover` for jsdom; `test/axe.ts` runs axe without color contrast (checked by the tokens test and the browser smoke run).

## CSS class API

One root class `di-<name>` on a native element. Variants are `data-*` attributes. State is native or ARIA
(`:disabled`, `[aria-invalid="true"]`, `[aria-selected="true"]`, `[aria-current="page"]`, `[aria-pressed="true"]`, `[aria-expanded="true"]`, `[aria-busy="true"]`).
React components and file names have no prefix; the `di-` prefix lives only in CSS and Angular selectors.

### Layers and theming

`base.css` declares `@layer deep-ink.base, deep-ink.components;` and every component stylesheet is wrapped in
`@layer deep-ink.components { … }`. Tokens stay unlayered on `:root`. Unlayered CSS always beats layered CSS, so your
overrides win without `!important`:

```css
.di-button[data-variant="primary"] { border-radius: 999px; }   /* wins, no matter the specificity */
```

Theme with the tokens: `data-theme="dark" | "light"` on `<html>` and the custom properties of `tokens.css`
(`--action`, `--surface`, `--border-control`, `*-tint`, …). Never put text on an alpha or `color-mix` background; use the opaque `*-tint` tokens.
Reduced motion is an unlayered block in `base.css`, so no component can opt out of it.

### Base and helpers

| Class | Purpose |
|---|---|
| `.di-sr-only` | Visually hidden, still announced. Keeps a focusable input usable (clip pattern) |
| `.di-skip-link` | First focusable element; visible on focus; points at `#main` |
| `.di-stack` | Column, gap `--di-gap` |
| `.di-inline` | Wrapping row, gap `--di-gap` |
| `:focus-visible` | 2px `--action` outline, 2px offset, `--shadow-focus` |

### Natural items

| Item | Markup and hooks |
|---|---|
| `icon` | `svg.di-icon`; decorative = `aria-hidden`, informative = `role="img" aria-label` |
| `button` | `.di-button[data-variant=primary\|secondary\|ghost\|danger][data-size=md\|sm][data-confirm][data-icon-only]`; works on `<button>`, `<a>` and `<label>`; `aria-pressed="true"` and `aria-busy="true"` are styled |
| `copy-button` | `.di-button.di-copy-button` plus a sibling `role="status"` live region |
| `field` | `.di-field[data-invalid] > .di-label (.di-required) + control + .di-help + .di-error` |
| `input` | `input.di-input[data-mono][data-size]`, `textarea.di-input` |
| `select` | `select.di-select[data-size]` |
| `checkbox` | `.di-choice > input.di-checkbox / input.di-radio + span (.di-choice-label, .di-choice-description)`; `fieldset.di-fieldset > legend` |
| `switch` | `.di-choice > input[type=checkbox][role=switch].di-switch + span` |
| `tabs` | `.di-tabs > [role=tablist].di-tablist[aria-label] > button[role=tab].di-tab[aria-selected][aria-controls] > .di-tab-count`; `[role=tabpanel].di-tabpanel[tabindex=0]` |
| `chip` | `.di-chip[data-tone=neutral\|info\|success\|warning\|danger][data-variant=solid\|outline\|dashed]`, `.di-chip-key`, `.di-chip-remove`; `button.di-chip[aria-pressed]` for filters |
| `panel` | `.di-panel[data-flush] > .di-panel-header > .di-panel-title + .di-panel-actions`, `.di-panel-body` |
| `table` | `.di-table-wrap[role=region][tabindex=0] > table.di-table[data-density] > caption`; `th[scope=col][aria-sort]`; `td[data-align=end][data-mono]`; `.di-table-sort`, `.di-table-rowlink`, `.di-table-empty`; `tr[data-selected]` |
| `dialog` | `dialog.di-dialog[data-size] > .di-dialog-header (.di-dialog-title) / .di-dialog-body (.di-dialog-description) / .di-dialog-footer`; `::backdrop` |
| `menu` | `button.di-button[popovertarget][aria-expanded] + div.di-menu[popover] > .di-menu-item[data-tone=danger]` |
| `segmented` | `.di-segmented > button[aria-pressed] > .di-segmented-count` |

Content, layout and Microcks items (callout, code-block, skeleton, progress, kbd, link, disclosure, description-list,
empty-state, app-shell, theme-toggle, api-badge, method-tag, status-badge, live-indicator, conformance-band, mock-url,
operation-row, ai-ghost-row, drop-zone, step-status, run-target, run-origin) document their hooks in their
`src/html/<name>.html` recipe, and every item lists its keyboard model, ARIA and RGAA/WCAG references in `items/<name>.json` (`a11y`).

### React conventions

Components forward native props and `ref` (React 19 ref-as-prop) to the root native element and merge `className`.
Field controls take the props from `Field`'s render function: `{(control) => <Input {...control} />}`.
Dialog initial focus: `data-autofocus`, else the first control of the body or footer, else the close button.
Tabs: put `TabPanel`s in `Tabs`'s children (ids are shared through context) or pass the same `idPrefix` to both.
