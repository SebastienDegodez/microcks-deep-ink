# Svelte workspace

`@microcks/deep-ink` for Svelte, with its own workspace and lockfile. It is an
alternative to the React/Angular implementations, not a multi-framework host.
The isolated React and Svelte packages deliberately keep the same name;
consumers choose their framework workspace. Private, version 0.0.0, not published.

## Current scope

Native Svelte 5 `Button`, `ButtonLink`, `MethodTag`, `StatusBadge`, `LiveIndicator`,
`SummaryStrip` and `SummaryStripSep`, plus every implemented upstream component
(forms, navigation, tables, dialogs, application shell and presentational leaves).
Declarations and layered shared CSS remain framework-isolated. The Svelte/Vite
Storybook mirrors the React Microcks taxonomy for native component examples,
including charts, conformance bands/matrices and split layouts. The [clickable demo](apps/demo/README.md)
now covers the 19 journey entry points with in-memory, simulated interactions and
imports the library via `workspace:*`; it is not a full port or pixel-parity claim.
Remaining registry items are listed by `pnpm -C svelte/packages/deep-ink pending`.
See [the package README](packages/deep-ink/README.md).

The library uses `$props`, `$derived`, snippets, native `class`/DOM attributes
and lowercase handlers such as `onclick`. Neither its public API nor its
production graph requires React. Storybook manager dependencies are development
tooling; a preview build guard rejects React runtime modules.

## Commands

Build the shared tokens/CSS at the repository root first (or wait for the
existing root build). This workspace reads those CSS outputs plus the registry's
checked-in icon source (no full registry build is needed):

```sh
pnpm --filter @microcks-deep-ink/tokens build
pnpm --filter @microcks-deep-ink/registry exec node scripts/build-css.mjs
pnpm -C svelte install --frozen-lockfile
pnpm -C svelte build
pnpm -C svelte check
pnpm -C svelte test
pnpm -C svelte lint
pnpm -C svelte publint
pnpm -C svelte check:boundaries
pnpm -C svelte storybook               # port 6008
pnpm -C svelte build:storybook
pnpm -C svelte demo                   # clickable prototype, port 5174
pnpm -C svelte build:demo             # native library + prototype
pnpm -C svelte smoke:package
pnpm -C svelte test:button-parity      # prerequisites below
```

Tests cover the variant combinations, snippets, native attributes/events,
SSR, shared CSS byte equality and structural accessibility. `smoke:package`
packs the actual package, installs it with npm in a unique workspace-local
scratch consumer, typechecks, builds client/SSR, runs SSR and checks that React
was not installed. Scratch files are removed, nothing is published.
CI runs these checks in `.github/workflows/svelte.yml`.
The workflow is reusable: `workflow_call` with `storybook: true` uploads
`storybook-svelte` for the Pages assembly job.

A one-off React/Svelte family pixel comparison passed 516/516 comparisons
(129 cases, both themes, 800/320px, Chromium 156.0.8078.4, scale 1), using
identical locally served OFL IBM Plex Sans/JetBrains Mono, shared CSS and
frozen motion. Outcome glyphs, meaningful whitespace, paused/compact live
variants, wrapping summaries and snippet compositions were included; maximum
differing pixels was zero. Fixtures/reports are session artifacts outside
the Svelte source tree, not an installed React dependency or a CI visual suite.
This evidence covers only the recorded family matrix, not the full demo or
arbitrary browsers. Boundary checks cover the library, Storybook and demo source,
and verify that the demo consumes the native workspace package.

Button has a repeatable strict pixel/browser suite in `test/button-parity/`.
It uses the real built Svelte package and read-only React reference, not a
local component imitation. Install the React workspace dependencies first.
Use Python with `test/button-parity/requirements.txt` and its Playwright Chromium
installed; `PARITY_PYTHON` can select an existing environment. The licensed
IBM Plex Sans fixture is checked against a pinned SHA-256, shared CSS is copied
once for both renders, and animation/transitions are frozen without masks.
The suite covers every variant/size on buttons and anchors, all 105 named
icons, both themes, 800/320px, hover/keyboard focus, pressed, danger-confirm,
icon-only, disabled/loading and the latest xs/outline/link tone. It also
checks real browser keyboard/navigation/form behavior and axe in both themes.
Chromium launches with the deterministic CPU raster flags read from
`tools/fidelity/snap.py` `DETERMINISTIC_ARGS` (default GPU raster produced a
2px anti-aliasing flake on a focus ring). `PARITY_REPEAT=n` captures every
state n times per framework and requires identical captures (self-parity);
`PARITY_CASES=case-85,...` limits a targeted rerun. Zero pixels may differ;
results and failure screenshots (stale ones are deleted at start) live in
ignored `test/button-parity/.artifacts/`. This command is not wired into root CI and
does not claim full-demo parity.

Icons are generated during build/check from the literal `PATHS` object in
`packages/registry/src/angular/icon.ts` (via the registry's `./angular/*`
export), using a TypeScript AST reader that rejects non-literal data. The
file is never imported or executed, so CI needs no full registry build
(`registry.full.json`) and no Angular runtime. No hand-maintained icon table
or React renderer is shipped. All names and
stroke/dash data must match the React reference before the pixel suite runs.
Navigation safety intentionally improves on upstream React `ButtonLink`: busy
or disabled links remove their href/tab stop, retain link semantics and suppress
activation. Disabled links announce `aria-disabled`; busy links announce
`aria-busy` and retain the unmodified React busy-link visual treatment.
The React fixture uses its supported `aria-disabled` attribute for disabled
links, with loading markup untouched. The suite does not claim React's
unguarded busy navigation is equivalent.

Recorded Button runs: two consecutive full runs with `PARITY_REPEAT=2` each
passed **2060/2060 strict comparisons**, 335 cases, Chromium 156.0.8078.4,
deterministic raster flags, both themes and widths, maximum React/Svelte and
self-capture differing pixels **0**; the previously flaky `case-85` focus state
also passed 50 repeated captures per framework.
Native keyboard/action/link navigation, form submission, element bindings,
disabled/loading activation/restoration and tab order passed; browser axe
reported no violations in either theme. Full current report:
`test/button-parity/.artifacts/report.json`.

## Upstream coordination

Read-only inspection of upstream `main` at `6cc2c14` found G0 #269
(`6a8afba`), G2a #275 (`b4c5fd8`) and the #276 parity helper (`2bb5284`).
Their `react-events.ts` maps React-named handlers and their MethodTag exposes
`className`/`ReactHandlers`. That is API compatibility coupling, even though the
helper imports Svelte types rather than the React runtime. This bounded branch
intentionally retains native APIs instead; the compatible runes configuration
is reused. #281 and #283 were still open when inspected. No whole-branch merge,
rebase or unchecked application of those pending families was performed.

## Remaining scope

The [follow-up contract](../docs/PLAN-v0.2.md#react--svelte-follow-up-contract-2026-11-07)
still requires the remaining native component families, a deterministic
cross-framework visual matrix, extracted framework-neutral demo-core, and a
complete behavioral/pixel parity with the React demo. The Svelte clickable
prototype imports reusable UI from the library rather than defining local
design-system components. Loom is outside this foundation:
future native framework renderers may differ (including a compiled Svelte
custom element), sharing neutral data/event contracts and pure layout rules
with exact visual/behavior equivalence. The existing element remains until
replacements are validated. Framework selection under the shared
npm name must be resolved before any publication; isolated workspaces alone
do not provide that selection.
