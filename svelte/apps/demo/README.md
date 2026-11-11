# Microcks UI v2 · DEMO (Svelte)

A clickable Svelte 5 prototype covering the same 19 journey entry points as the
React demo. The layout, dark/light themes and controls use the **built native
`@microcks/deep-ink` library**, declared as `"workspace:*"` in this isolated
workspace. No design-system component implementation or CSS is copied into the
demo. `src/pages/` only composes screens; `demo.css` contains page layout glue.

```sh
# From the repository root, after the shared tokens/elements/CSS build:
pnpm -C svelte install --frozen-lockfile
pnpm -C svelte build
pnpm demo:svelte                     # http://127.0.0.1:5174/
pnpm build:demo:svelte               # svelte/apps/demo/dist/
pnpm -C svelte --filter demo-svelte test
pnpm -C svelte check:boundaries
```

`#/map` links to all 19 screens. The hash router and relative Vite base allow
deployment under `/demo-svelte/` on GitHub Pages. The Pages assembly and reusable
Svelte CI workflow include this consumer.

Implemented interactions include catalogue filters/table/badge wall, example
selection, dispatcher configuration and simulation, AI proposal accept/edit/reject,
source preview/confirmation, test configuration and replay/pause/step, workflow
Loom selection and target-dependent replay, trace pause/inspection, Hub installation,
roles/groups, masked dummy-secret creation/deletion and snapshot metadata.
State survives navigation but resets on reload. Themes use the library's existing
persistence. Runtime and build dependency guards reject React.

**This is not a full port of the React application's domain/use-case layer.**
Contracts, import previews, AI proposals, network traffic and test execution are
explicitly simulated sample data, not real network calls. Non-Pastry service
detail pages currently reuse the Pastry sample operations. The agent test matrix
is a static inspection fixture, not a complete conformance runner. Snapshots are
metadata, not backup files. No full-screen pixel parity is claimed.

Every screen is marked DEMO; nothing is published on npm. Accessibility status:
**not audited** (RGAA 4.1.2 / WCAG 2.1 AA target).
