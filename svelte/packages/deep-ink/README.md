# @microcks/deep-ink (Svelte)

**Native Svelte 5 components, not a Svelte application/demo.** Private,
version 0.0.0, not published. `svelte-package` exports `.svelte` components,
JavaScript, declarations and the shared CSS with its existing layers.
The package has only a Svelte peer (`^5.19.0`, supporting class arrays/objects).
There is no React dependency or compatibility-handler API.

```svelte
<script lang="ts">
  import { Button, ButtonLink, MethodTag, StatusBadge, LiveIndicator, SummaryStrip, SummaryStripSep } from '@microcks/deep-ink';
  import '@microcks/deep-ink/styles.css';
</script>

<MethodTag method="GET" protocol="REST" class="operation" title="Read" minWidth={52} />
<Button variant="primary" icon="plus" onclick={() => console.log('Create')}>Create API</Button>
<Button variant="outline" tone="link" size="xs" icon="undo">Undo</Button>
<Button icon="trash" iconOnly aria-label="Delete API" />
<ButtonLink href="/services" icon="external">View services</ButtonLink>
<StatusBadge status="running" label="Retrying">
  {' · attempt '}<strong>2</strong> of 3
</StatusBadge>
<LiveIndicator size="compact" pulse={false} />
<SummaryStrip parts={[{ text: 'Saved', kind: 'label' }, { text: '3 APIs', sep: true }]} lineHeight="inherit" role="note" aria-label="Import summary">
  <SummaryStripSep />
  <a href="/services">View services</a>
</SummaryStrip>
```

Import `styles.no-fonts.css` instead to load fonts yourself. CSS is explicit,
never implicitly injected by components; both CSS files are copied unchanged
from the root registry build. No registry/React renderer enters the runtime.

## Shared web elements

`PluginSlot` and `WorkflowLoom` wrap the same self-registering Web Component
bundles as the other framework packages. Their custom elements are defined only
in the browser; server rendering emits the element hosts safely. `PluginSlot`
accepts a `point`, optional `context` and `outlined`, and a fallback snippet.
`getPluginHost()` accesses the global plugin registry. `WorkflowLoom` accepts
its sources, steps and threads as properties; `onstepselect` and
`onlensselect` receive event detail objects. Both expose `bind:element`.

Before building this package, build the root `packages/plugin-sdk`,
`packages/tokens`, `packages/registry`, and `packages/core` packages. The Svelte
build copies the core element bundles into its own distribution; consumers do
not need the core package at runtime.

## Public family

The native family below is retained alongside all upstream exports: `AppShell`,
`Callout`, `Checkbox`, `Radio`, `RadioGroup`, `Chip`, `CodeBlock`, `CommandBar`,
`CopyButton`, `DescriptionList`, `Dialog`, `Disclosure`, `EmptyState`, `Exchange`,
`ExchangeCard`, `Field`, `Icon`, `Input`, `Textarea`, `Kbd`, `Link`, `Menu`, `Panel`,
`Meter`, `Progress`, `ProjectionPill`, `RunMeta`, `RunOrigin`, `RunProgress`,
`RunTarget`, `RunnerLog`, `StepStatus`, `StepChecks`, `Stepper`, `CiPanel`,
`DropZone`, `TaskStateTag`, `TaskTimeline`, `TaskLanes`,
`Segmented`, `Select`, `Skeleton`, `Switch`, `DataTable`, `Tabs`, `TabPanel`,
`ThemeToggle`, `Tile` and `TileGrid`, plus their public type/helper modules.

All ports use `class`, lowercase native DOM events and lowercase callback props
(`onchange`, `onclose`, `onsortchange`, `onrowselect`, `onremove`, `onselect`).
Use `oninput` for per-keystroke text input, `onchange` for committed changes,
and `bind:value` / `bind:checked` for controlled state. DOM event capture uses
`onclickcapture` etc.; no synthetic event names or handler translation remain.
`Switch` separately forwards native `onchange` events and calls
`oncheckedchange` with the boolean state.
`RowLinkProps` uses `class` for its custom link snippet.

Run components share the reference DOM/classes and accessible naming. `RunProgress`
keeps the current step's polite announcement outside its busy bar, and reads its
`note` before the `action` control. Pass rich content through named snippets
(`action`, `note`, `pill`, `hint`, `footnote`, `status`) or snippet-valued step/meta
items. `Stepper` writes completion text and marks the current ordered-list item.
`TaskTimeline` uses `onselectnode(index | undefined)` to select/clear a node;
`TaskLanes` is a keyboard-reachable comparison region. `DropZone` uses a real,
labelled file input and `onfiles(File[])`; drag/drop only enhances that input.
It resets the picker after selection so the same files can be chosen again.
The `accept` attribute is a picker hint, not file validation.

The legacy `button/` and `method-tag/` component paths are forwarding wrappers,
not separate implementations. Internal consumers render the canonical native
components directly; button helpers and protocol mappings share the same bindings.

Shared HTML parity cases are adapted only at the test-data boundary. Two
intentional native accessibility/safety differences are asserted: a busy
`ButtonLink` has no `href` or tab stop, and `RadioGroup` exposes `radiogroup`
(which supports `aria-invalid`) rather than an implicit generic group.

| Component | Supported variants / props |
| --- | --- |
| `Button` | Native action, default `type="button"`; variants primary/secondary/outline/ghost/link/dashed/danger; sizes xs/sm/compact/tile/md/lg; tone danger/link; confirm, all registry icon names, iconOnly, loading/disabled; children snippet; bind:element |
| `ButtonLink` | Same styling/contents on a native navigation anchor; href/target/rel and native handlers; bind:element; loading/disabled (or aria-disabled=true) removes href/tab stop and suppresses activation |
| `MethodTag` | `method`, `protocol` REST/SOAP/EVENT/gRPC/GRAPHQL/DIRECT/A2A; `size` md/sm/xs; nonzero `minWidth` in px; zero/omitted retains host/default width, matching the React reference |
| `StatusBadge` | `status` conformant/failed/partial/running/never; `size` md/sm/lg; `shape` circled/bare; text/snippet `label`; `children` snippet for supplemental rich context |
| `LiveIndicator` | `label`, `paused`, `pausedLabel`; `size` md/sm/compact/lg; `variant` pill/inline/box/dot; `pulse` (default true) |
| `SummaryStrip` | `parts` with `text: string \| Snippet`, `kind` value/label, `sep`; `gap` normal/roomy; `values` secondary/text; `variant` default/canvas; `lineHeight` fixed/inherit; free `children` snippet |
| `SummaryStripSep` | Decorative separator; native span attributes except `aria-hidden`, which is always true |

Props/types, `Protocol`, `Outcome`, `SummaryStripPart` and `PROTOCOL_ATTR` are
exported from the barrel. Components accept native attributes, Svelte class
values and native event handlers (`onclick`, not `onClick`; `class`, not
`className`). Markup content uses Svelte snippets, not ReactNode-compatible
objects. For a rich part, declare `{#snippet value()}<strong>3</strong> APIs{/snippet}`
and pass `parts={[{ text: value }]}`.

`ButtonProps`, `ButtonLinkProps`, `ButtonVariant`, `ButtonSize`, `ButtonTone`
and `IconName` are public types. Buttons preserve native form submission,
reset, keyboard activation and DOM event objects. Use `ButtonLink` rather than
React's `asChild`, `ref`, or compatibility event names. `bind:element` exposes
the real button/anchor. Icon-only controls require `aria-label`,
`aria-labelledby` or a meaningful `title` (missing names produce a diagnostic).
The leading icon remains decorative and loading sets `aria-busy`; the shared
CSS draws the spinner. Loading actions cannot activate. Disabled/busy anchors
remove href (also preventing context-menu/middle-click navigation), are removed
from the tab order and retain link semantics until enabled. Disabled links
announce `aria-disabled`; busy links announce `aria-busy` with the unchanged
React busy-link styling.
This intentionally fixes React's unguarded loading-link navigation, rather
than reproducing that defect. Apply filled danger only inside confirmation UI.

The complete registry glyph contract is generated at build/check from the
literal data in registry `src/angular/icon.ts` through a literal-only AST
parser (never imported/executed; no full registry build required), not duplicated in authored
Svelte source. Packed runtime/declarations include the generated neutral data;
only `IconName` is public. Package exports reject internal deep imports.
Consumers need neither the registry nor either other framework at runtime.

Status icons and live dots are decorative. Status always has a visible word:
blank labels fall back, and even an empty supplemental snippet cannot remove
it. LiveIndicator is **not** a status/live region; announce changes elsewhere
and pair a real stream with a Pause control. Include “paused” in `pausedLabel`.
Dot-only labels remain in `.sr-only`; shared reduced-motion CSS disables pulse.
Summary separators are hidden from assistive technology; supply `role="note"`
and an accessible label when the strip represents a page summary.

## Build and verification

From the repository, after shared tokens/registry CSS are built:

```sh
pnpm -C svelte build                # native source + declarations + CSS
pnpm -C svelte check                # library and Storybook, zero warnings
pnpm -C svelte test                 # DOM + separate SSR variant/axe/contracts suites
pnpm -C svelte check:boundaries     # source, declarations, production graph
pnpm -C svelte build:storybook      # isolated Svelte preview, all public variant axes
pnpm -C svelte smoke:package        # actual npm tarball, standalone no-React consumer
pnpm -C svelte test:button-parity   # repeatable strict Button matrix; see workspace prerequisites
```

The pack smoke rebuilds via `prepack`, validates artifact contents, typechecks
typed snippets/native attributes and runs client/SSR builds plus SSR output
assertions. No publish command exists. Axe tests are structural, not contrast
tests. A separate session-only React/Svelte SSR comparison verified zero
differing pixels in 516 comparisons (129 family cases, light/dark, 800/320px,
Chromium 156.0.8078.4, device scale 1). Both fixtures preloaded identical local
OFL fonts, used the same shared CSS and froze motion; exact untrimmed
SummaryStrip part/snippet/link text also matched. This is bounded family
evidence, not a full-demo or CI visual-regression claim.
The standalone fixture is package-validation code, not a partial product demo.
The repeatable Button suite additionally covers all sizes/variants, all 105
glyphs, hover/focus and representative states with pinned common fonts/CSS,
no tolerance or masks; it verifies native browser events/navigation and axe.
Disabled React anchors use their supported aria-disabled API in the
reference fixture; loading markup is untouched. Their broken busy navigation
is not claimed as equivalent.
Two consecutive recorded Button runs each passed 2060/2060 comparisons (335
cases, both themes, 800/320px, Chromium 156.0.8078.4 with the deterministic
raster flags from `tools/fidelity/snap.py`, scale 1, two self-identical captures
per state), with maximum differing pixels zero,
and passed browser keyboard/form/link/element-binding/axe checks. Its full
report is `svelte/test/button-parity/.artifacts/report.json`.
Additional components and the full demo remain separate work.
Loom is outside this family. Native React/Svelte renderers may share neutral
data/event contracts and pure layout rules without sharing a rendering engine;
exact visual/behavior equivalence must be validated before replacing the
existing element.

## Adding an item

1. `src/lib/<item>/` (the registry item name): one `PascalCase.svelte` file per exported component, named after the
   React export (`table/DataTable.svelte`); helpers and types in `.ts` / `.svelte.ts` modules (exported with
   `export *`). Lowercase or `_`-prefixed `.svelte` files stay private. **No `<style>`**: the CSS is the registry CSS
   (lint error).
2. `pnpm gen:index` regenerates `src/lib/index.ts` from `packages/registry/items` (never edit it; the build runs
   `--check`, `test/barrel.test.ts` rejects duplicate names).
3. Spec next to it, `src/lib/<item>/<item>.spec.ts`: Testing Library, `@testing-library/user-event`,
   `axeViolations` from `test/axe.ts` (jsdom; `test/setup.ts` polyfills `<dialog>` and popover).
4. Parity with React: add `packages/registry/parity/<item>.cases.json`, run `pnpm -C react/packages/deep-ink parity`
   and commit the `.html` files. `test/parity.ssr.test.ts` renders each case with `svelte/server` and compares the
   normalised markup (`test/parity/normalise.ts`); see `packages/registry/parity/README.md`.

Build: `pnpm build` at the repo root, then `pnpm -C svelte install --frozen-lockfile && pnpm -C svelte build`.

## Charts and split layouts

`BarChart` exports `BarChartBar`, `BarChartTable`, `BarTone` and `BarChartProps`.
Pass `onselect(id)` and update `selectedId` to control selection. Arrow keys,
Home and End move focus between selectable bars, skipping future slots. The
required `table` is the visually hidden text equivalent; `overlay` is a
Svelte snippet. Heights, ticks, grid lines and selection styles match React.

`ConformanceBand` exports `OperationResult`, `conformanceLabel` and
`ConformanceBandProps`; labelled bands are named lists, unlabelled bands are
named images. `ConformanceMatrix` exports the `MatrixColumn`, `MatrixGroup`,
row/cell/footer types and `cellKey`. Use `onselectcell(key)` with `selectedKey`;
pressing the selected finished cell clears it. Queued/running cells are text.

`SplitPane`, `SplitPaneSide` and `SplitPaneMain` preserve reading order,
landmarks and the React wrapping layout's width/gap/alignment variables.
The React SplitPane API has no resize handle or keyboard/pointer resizing.

`StatusBadge.label` accepts a text value or snippet for a formatted replacement
word; blank text retains the default status word. `children` remains available
for supplemental context.
