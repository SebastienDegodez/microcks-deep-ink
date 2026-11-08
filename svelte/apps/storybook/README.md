# Svelte Storybook examples

**Show code** displays the actual `.svelte` composition used by each story,
including local helper files when an example spans multiple components.
Direct package-component stories show Svelte markup generated from the current
Controls, with raw snippet arguments translated into Svelte snippet blocks.

The `story-source` Vite plugin reads these files at build time, watches them in
development, and sets `parameters.docs.source`. No separate example copy is
maintained. Unsupported story renderers fail the build instead of exposing the
internal CSF adapter as usage code.

Run `pnpm -C svelte/apps/storybook test` for source-display regression tests.
After building Storybook, `python scripts/check-story-source.py` (from this
directory, with Playwright and Chromium installed) verifies the actual
**Show code** controls. Both checks run in CI.
