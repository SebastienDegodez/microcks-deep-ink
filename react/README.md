# React workspace

`@microcks/deep-ink`, the React package of Deep Ink, lives here with its own `pnpm-workspace.yaml` and lockfile.
It is **not** part of the root workspace and it is **not published**: the package is `private`.

```bash
pnpm install --frozen-lockfile && pnpm build      # at the repo root: tokens, elements, registry CSS
pnpm -C react install --frozen-lockfile
pnpm -C react build
```

It consumes the root's built CSS and element bundles through `link:` devDependencies only, so the root packages
must be built first. CI: `.github/workflows/react.yml`.
