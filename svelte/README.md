# Svelte workspace

`@microcks/deep-ink` for Svelte, with its own workspace and lockfile. It is an
alternative to the React/Angular implementations, not a multi-framework host.
The isolated React and Svelte packages deliberately keep the same name;
consumers choose their framework workspace. Private, version 0.0.0, not published.

## Current scope

Native Svelte 5 `MethodTag`, `StatusBadge`, `LiveIndicator`, `SummaryStrip` and
`SummaryStripSep`; declarations and unchanged layered shared CSS; an isolated
Svelte/Vite Storybook with 42 stories. No Svelte demo is implemented here and
this is not a complete component port. See [the package README](packages/deep-ink/README.md).

The library uses `$props`, `$derived`, snippets, native `class`/DOM attributes
and lowercase handlers such as `onclick`. Neither its public API nor its
production graph requires React. Storybook manager dependencies are development
tooling; a preview build guard rejects React runtime modules.

## Commands

Build the shared tokens/CSS at the repository root first (or wait for the
existing root build). This workspace only reads those outputs:

```sh
pnpm --filter @microcks-deep-ink/tokens build
pnpm --filter @microcks-deep-ink/registry exec node scripts/build-css.mjs
pnpm -C svelte install --frozen-lockfile
pnpm -C svelte build
pnpm -C svelte check
pnpm -C svelte test
pnpm -C svelte check:boundaries
pnpm -C svelte storybook               # port 6008
pnpm -C svelte build:storybook
pnpm -C svelte smoke:package
```

Tests cover the variant combinations, snippets, native attributes/events,
SSR, shared CSS byte equality and structural accessibility. `smoke:package`
packs the actual package, installs it with npm in a unique workspace-local
scratch consumer, typechecks, builds client/SSR, runs SSR and checks that React
was not installed. Scratch files are removed, nothing is published.
CI runs these checks in `.github/workflows/svelte.yml`.

A one-off React/Svelte family pixel comparison passed 516/516 comparisons
(129 cases, both themes, 800/320px, Chromium 156.0.8078.4, scale 1), using
identical locally served OFL IBM Plex Sans/JetBrains Mono, shared CSS and
frozen motion. Outcome glyphs, meaningful whitespace, paused/compact live
variants, wrapping summaries and snippet compositions were included; maximum
differing pixels was zero. Fixtures/reports are session artifacts outside
the Svelte source tree, not an installed React dependency or a CI visual suite.
This evidence covers only the recorded family matrix, not the full demo or
arbitrary browsers. Boundary checks currently cover the library and Storybook;
there is no demo source tree to scan yet.

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
complete Svelte demo that imports reusable UI from the library rather than
defining local design-system components. Loom is outside this foundation:
future native framework renderers may differ (including a compiled Svelte
custom element), sharing neutral data/event contracts and pure layout rules
with exact visual/behavior equivalence. The existing element remains until
replacements are validated. Framework selection under the shared
npm name must be resolved before any publication; isolated workspaces alone
do not provide that selection.
