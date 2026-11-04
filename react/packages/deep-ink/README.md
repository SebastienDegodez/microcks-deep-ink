# @microcks/deep-ink (React)

Deep Ink React components for the Microcks UI v2. **Private, version 0.0.0, not published.**

```tsx
import '@microcks/deep-ink/styles.css';            // once, in the entry file (or styles.no-fonts.css)
import { Button, Panel, restoreTheme } from '@microcks/deep-ink';
```

- ESM only, one module per component (tree-shakable), `react ^19` as a peer dependency, no CSS import inside components.
- `styles.css`: tokens (unlayered, on `:root`), then `@layer deep-ink.base, deep-ink.components`, built by `packages/registry`.
- The Web Components (`workflow-loom`, `plugin-slot`) ship as self-contained bundles in `dist/elements/`.

Build (the root packages first): `pnpm build` at the root, then `pnpm -C react install --frozen-lockfile && pnpm -C react build`.
`src/index.ts` is generated from `packages/registry/items`: run `pnpm -C react/packages/deep-ink gen:index` after adding an item.
Checks: `test`, `typecheck`, `lint`, `publint`, `attw`, `pack:check`.
