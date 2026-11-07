# Svelte workspace

`@microcks/deep-ink` for Svelte, with its own `pnpm-workspace.yaml` and lockfile. Not part of the root workspace,
private, not published. For now it ships only the stylesheet (`dist/styles.css`): see `packages/deep-ink/README.md`.
CI: `.github/workflows/svelte.yml`.

The [React/Svelte follow-up contract](../docs/PLAN-v0.2.md#react--svelte-follow-up-contract-2026-11-07)
defines the target: a native Svelte 5 component library, its own Storybook and
a complete demo matching the React reference pixel for pixel. The planned npm
name is `@microcks/deep-ink-svelte`, distinct from React's `@microcks/deep-ink`;
the current stylesheet-only package has not been renamed or published yet.
Svelte library/demo code must not depend on React. Only framework-neutral
styles, assets, contracts and demo-core logic are shared.
