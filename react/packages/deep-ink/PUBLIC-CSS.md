# Public CSS surface used by the demo pages

The demo pages (`apps/demo-react/src/ui/pages/**/*.css`) still style these registry classes directly. Until each one
gets a component option, they are part of the package's public API: renaming the class, moving the element or changing
the listed structure is a breaking change. Everything else (any class not listed here) is internal.

Guarantees below hold within `0.x`: the class name is stable, it stays on the element described, and the component
styles stay in `@layer deep-ink.components`, so an unlayered page rule wins whatever its specificity.
Count: `python3 -I tools/fidelity/registry-selectors.py .` (114 selectors, 39 classes).

Pages style their own elements through the documented `className` prop (merged on the root element) and the native
props forwarded to it (`strokeWidth` on `Icon`); those are not listed.

## Layout parts

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.panel-header`, `.panel-title`, `.panel-actions` (+ `a`) | header row of `Panel` | behavior (align-items, font-size, link hover), simulator (title flex) |
| `.panel-body` | body of `Panel`, the parent of its children | behavior, usage (display flex column, gap, padding) |
| `.stat-card`, `.stat-card-body`, `.stat-card-value`, `.stat-card-action > a` | `StatCard` root, body, value, action link | cockpit (gap, muted empty value, link hover) |
| `.facts-row` (`> dd`) | one term/value row of `Facts` | sources, usage (align, gap, font-size, line-height) |
| `.tablist`, `.tab` | `Tabs` list and tab buttons | import (gap, padding) |
| `.tile-tag` | tag in a `Tile` title | hub (flex) |

## Tables

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.table` (+ `th`, `td`, `thead th`, `tr > :first-child/:last-child`, `th:nth-child(n)`) | the `<table>` of `DataTable`/`Table`; cells are native `th`/`td` | admin, catalogue, workflow, workflow-run (min-width, table-layout, cell padding and widths, font-size) |
| `.table-empty` | empty-state cell | admin (padding, font) |
| `.table-wrap` | scroll region around the table | tests (border, radius) |

## Form controls

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.field`, `.label`, `.help` | `Field` root, its `<label>` and help `<p>` | admin, agent, traces (gap, label typography, help color) |
| `.select` (`:disabled`) | `Select` inside a page cell | admin role cell (min-height 34px, font-size, disabled opacity) |
| `.choice`, `.choice-label`, `.choice-description` (`> span:last-child`, `:has(input:checked)`) | `Checkbox`/`Radio`/`Switch` root `<label>`, its label and description spans | agent, behavior, import, sources, test-create, workflow-run (flex sizing, padding, alignment, typography) |

## Buttons

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.button` (`[data-size='sm']`) | `Button` root inside a page container | admin, copilot, service, sources, workflows (min-height, padding, gap, font-weight, colors) |
| `.button .icon`, `.copy-button` icon | icon rendered by `Button icon=` / `CopyButton` | agent, service (hidden), workflows (12px, stroke-width) |
| `.code-copy.button` | copy button in the `CodeBlock` caption | test-create (margin) |

## Badges and tags

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.api-badge` (`> span`, `[data-status]`) | `ApiBadge` root and its segments | agent (hover filter), cockpit (segment padding), sources (neutral name color) |
| `.api-badge-type`, `.api-badge-name`, `.api-badge-version` (`::before`), `.api-badge-name > .icon` | the three segments of `ApiBadge` | catalogue, cockpit, workflows, sources (hover underline, truncation, padding, color) |
| `.chip-label`, `.chip-value`, `.chip-count`, `.chip .icon` | parts of `Chip` | workflows unlinked-source chip (gap, alignment, colors) |
| `.status > span` | label of `StatusBadge` | catalogue (hover underline) |
| `.live-dot` | dot of `LiveIndicator` | cockpit (8px) |
| `.conformance[data-size='mini']` | `ConformanceBand` mini root | cockpit (flex, height) |
| `.run-meta` | `RunMeta` root, as a `:has()` hook | agent test run header |

## Code and exchanges

| Class | Element / part | Used by (properties) |
|---|---|---|
| `.code-caption` | caption of `CodeBlock` | agent (font, color) |
| `.exchange-card > pre` | request/response blocks of `ExchangeCard` | copilot, service (padding) |
| `.exchange` | name clash: the agent test page's own `.exchange` block also gets the registry `.exchange` rules | agent (layout, border) |

## Registry options that would retire these selectors

- `Panel`: a body layout option (stack + gap, 18px padding) — 10 `.panel-body`.
- `DataTable`: `minWidth`, fixed layout, column widths and cell padding — 22 `.table`.
- `Checkbox`/`Radio`/`Switch`: a root `className` (today it goes to the `<input>`) and a compact description style — 10 `.choice`, 7 `.choice-*`.
- `ApiBadge`: a truncating tile variant and a link-hover underline — 16 `.api-badge*`.
- `Button`: a 34/36px secondary size with md padding — 5 `.button`; `CopyButton`: `hideIcon` — 2 `.icon`.
- `Field`: compact/caps label style; `Select`: a 34/36px size — 7.
- `StatCard`: gap and empty-value tone — 4.
