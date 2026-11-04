# @microcks/deep-ink (Svelte)

**No components yet.** This package ships only the Deep Ink stylesheet: tokens, base and every component's CSS,
layered (`@layer deep-ink.base, deep-ink.components`). Svelte components will reuse the same CSS class API and the
HTML recipes of `packages/registry/src/html`. Private, version 0.0.0, not published.

```js
import '@microcks/deep-ink/styles.css';            // or styles.no-fonts.css to load the fonts yourself
```

Build: `pnpm build` at the repo root, then `pnpm -C svelte install --frozen-lockfile && pnpm -C svelte build`.
