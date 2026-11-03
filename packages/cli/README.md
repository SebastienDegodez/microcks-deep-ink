# @microcks-deep-ink/cli

Copies Deep Ink components from the registry into your app, shadcn-style. You own the copied files.
Zero dependencies (Node 22 built-ins only). DEMO tooling, private, not published to npm.

## Run it

```bash
pnpm build                                   # builds tokens and the registry JSON the CLI reads
pnpm deep-ink <command>                      # from the repo root
node <repo>/packages/cli/bin/deep-ink.mjs …  # from anywhere
npx <repo>/packages/cli …                    # same, through npx
```

The CLI reads `packages/registry/dist/registry.full.json`. If it is missing it stops with
"Run `pnpm build` in the Deep Ink repo first." Use `--registry FILE` to read another file.

## Commands

```
deep-ink init  [--framework react|angular|html] [--out DIR] [--css-out DIR] [--no-fonts] [--cwd DIR] [--yes]
deep-ink add   <item...> | --all [--tier natural,microcks,element] [--framework …] [--out DIR] [--css-out DIR]
               [--overwrite] [--dry-run] [--cwd DIR] [--registry FILE]
deep-ink list  [--framework …] [--tier …] [--json]
deep-ink diff  <item> [--cwd DIR]       # unified diff, local file vs registry
deep-ink view  <item> [--framework …]   # prints the files
```

| Framework | Detected when `package.json` has | `--out` | `--css-out` |
|---|---|---|---|
| angular | `@angular/core` | `src/app/ui` | `src/styles/deep-ink` |
| react | `react` | `src/components/ui` | `src/styles/deep-ink` |
| html | neither | `deep-ink` | `deep-ink/css` |

`init` copies `tokens.css` (or the variant without web fonts with `--no-fonts`) and `base.css`, writes
`<css-out>/index.css` (the `@import` lines in dependency order, rewritten after every `add`) and `deep-ink.json`.
`add` works without `init`: tokens and base are dependencies of every item.

`add` resolves `registryDependencies` transitively, then copies the framework files, the CSS and, for element items,
the self-contained bundle in `<out>/elements/`. For `html` it copies the recipes (`<name>.html`) and the CSS.

## Safe upgrades: the overwrite policy

`deep-ink.json` stores the SHA-256 of every copied file.

| File state | Result |
|---|---|
| identical to the registry | skipped (`up to date`) |
| unchanged since the last copy | updated silently |
| modified locally | skipped and reported, exit code 2 |
| modified locally, `--overwrite` | replaced |

`--dry-run` prints what would change and writes nothing. Use `deep-ink diff <item>` to see your edits.

Exit codes: `0` ok, `1` error, `2` some files were skipped because you modified them.

Output is plain lines (`added  src/components/ui/button.tsx`). Colors are off when `NO_COLOR` is set or stdout is not a TTY.

## Tests

```bash
pnpm --filter @microcks-deep-ink/cli test    # node --test, temp directories
```
