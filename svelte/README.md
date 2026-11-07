# Svelte workspace

`@microcks/deep-ink` for Svelte 5, with its own `pnpm-workspace.yaml` and lockfile. Not part of the root workspace,
private, not published (React owns the npm name for now). See `packages/deep-ink/README.md`.

```sh
pnpm build                                   # at the repo root first: tokens and registry CSS
pnpm -C svelte install --frozen-lockfile
pnpm -C svelte lint && pnpm -C svelte check && pnpm -C svelte test && pnpm -C svelte build && pnpm -C svelte publint
```

CI: `.github/workflows/svelte.yml` (the same steps).
