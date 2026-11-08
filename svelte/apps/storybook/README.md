# Svelte Storybook examples

**Show code** uses Storybook's standard `parameters.docs.source` API.
Composition stories import their `.svelte` example via Vite's standard `?raw`
import; examples spanning several files include their local helpers.
Direct package-component stories declare a Svelte usage example for their
default arguments.

The only source transform is display formatting: `example-source.ts` (a Vite
plugin) formats each `*.svelte?raw` example with Prettier and drops unused
imports, so **Show code** shows one element per line. The rendered component
keeps its exact markup. `.storybook/svelte-syntax.ts` registers a `svelte`
grammar so the code is syntax-highlighted. There is no custom renderer.
When adding a story, declare its native `docs.source.code` alongside its args
and render function so the internal CSF adapter is not shown as usage code.

Run `pnpm -C svelte/apps/storybook test` for source-display regression tests,
and `pnpm -C svelte/apps/storybook test:stories` to run every story (render,
play and a11y) in Chromium with the Storybook Vitest addon.
After building Storybook, `python scripts/check-story-source.py` (from this
directory, with Playwright and Chromium installed) verifies the actual
**Show code** controls. Both checks run in CI.
