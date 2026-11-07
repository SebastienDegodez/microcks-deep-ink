# @microcks/deep-ink (Svelte)

Deep Ink components for Svelte 5 (runes), built with `@sveltejs/package` (`src/lib` → `dist`), plus the Deep Ink
stylesheet: tokens, base and every component's CSS, layered (`@layer deep-ink.base, deep-ink.components`). The
components reuse the CSS class API and the HTML recipes of `packages/registry`, and React's prop names (`className`
...). Private, version 0.0.0, not published. Only peer dependency: `svelte`; no runtime dependency.

```js
import { Kbd } from '@microcks/deep-ink';
import '@microcks/deep-ink/styles.css';            // or styles.no-fonts.css to load the fonts yourself
```

Pending items: `pnpm pending` (every registry item without a `src/lib/<item>/` folder).

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
