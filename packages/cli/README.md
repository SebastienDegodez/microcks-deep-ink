# @microcks-deep-ink/cli

Copies Deep Ink components from the registry into your Angular or plain HTML app, shadcn-style. You own the copied files.
**React apps do not copy:** they use the `@microcks/deep-ink` package (`react/packages/deep-ink`). In a React project (unless its `deep-ink.json` says
angular or html, see below), or with `--framework react`, the CLI prints `pnpm add @microcks/deep-ink` and the imports, and copies nothing (`--framework html`
still copies the HTML recipes).
Zero dependencies (Node 22 built-ins only). DEMO tooling, private, not published to npm.
The item names are the registry names (`button`, `tabs`, `workflow-loom`...); `deep-ink list` prints them.

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
deep-ink init   [--framework angular|html] [--out DIR] [--css-out DIR] [--no-fonts] [--cwd DIR]
deep-ink add    <item...> | --all [--tier natural,microcks,element] [--framework …] [--out DIR] [--css-out DIR]
                [--overwrite | --merge] [--prune] [--markup-only] [--dry-run] [--cwd DIR] [--registry FILE]
deep-ink list   [--framework …] [--tier …] [--json] [--cwd DIR]
deep-ink status [item…] [--exit-code] [--json] [--cwd DIR]   # up to date | upstream changed | locally modified | both
deep-ink diff   <item> [--exit-code] [--cwd DIR]              # your edits and upstream changes, separately
deep-ink view   <item> [--framework …]                        # prints the files
```

| Framework | Detected when `package.json` has | `--out` | `--css-out` |
|---|---|---|---|
| angular | `@angular/core` | `src/app/ui` | `src/styles/deep-ink` |
| react | `react` (and no `@angular/core`) | nothing copied: use `@microcks/deep-ink` | |
| html | neither | `deep-ink` | `deep-ink/css` |

The framework comes from `--framework`, else from `framework` in an existing `deep-ink.json`, else from detection.
So a project whose `deep-ink.json` says `angular` or `html` keeps copying that framework even if `package.json` has
`react`; pass `--framework react` to get the package notice there instead (nothing is read or written).

`init` copies `tokens.css` (or the variant without web fonts with `--no-fonts`) and `base.css`, writes
`<css-out>/index.css` (the `@import` lines in dependency order, rewritten after every `add`) and `deep-ink.json`.
`add` works without `init`: tokens and base are dependencies of every item.

`add` resolves `registryDependencies` transitively, then copies the framework files, the CSS and, for element items,
the self-contained bundle in `<out>/elements/`. For `html` it copies the recipes (`<name>.html`) and the CSS.

## Safe upgrades: the overwrite policy

`deep-ink.json` records, per item, the content hash of the item (`hash`, computed by the registry build over all its
files: it changes when, and only when, the item changes), the registry `version` it was copied from, and the SHA-256 of
every copied file. The **base copy** of every file, the registry version exactly as you got it, is kept in
`.deep-ink/base/<same path>` next to `deep-ink.json`. **Commit both**: the base is what lets deep-ink tell your edits
from upstream changes.

| File state | Result |
|---|---|
| identical to the registry | skipped (`up to date`) |
| unchanged since the last copy | updated silently, base moves forward |
| modified locally | skipped and reported, exit code 2 |
| modified locally, `--overwrite` | replaced, base moves forward |
| modified locally, `--merge`, registry unchanged | `kept`, nothing to do |
| modified locally, `--merge`, registry changed too | three-way merge (below) |

`--overwrite` and `--merge` are mutually exclusive. `--dry-run` prints what would change and writes nothing.

### status and diff

`deep-ink status` compares every file of every item in `deep-ink.json` with its base and the current registry:

```
tabs    up to date
button  locally modified
  local    src/components/ui/button.tsx
panel   both (conflict)
  both     src/components/ui/panel.tsx
dialog  upstream changed
```

`both (conflict)` means the same file changed on both sides. `--json` prints the rows; `--exit-code` exits 1 when anything
is not up to date.

`deep-ink diff <item>` shows two separate diffs per file: **local edits** (base -> your file) and **upstream changes**
(base -> registry). It always exits 0, unless you pass `--exit-code`, which exits 1 when there is any difference (a file
that is missing, edited, outdated or orphaned), like `git diff --exit-code`.

### add --merge

When both sides changed a file, `--merge` runs a three-way merge of your file, the base and the registry version with
`git merge-file` when git is installed, and otherwise writes the whole file as one conflict. Clean merges are written
silently (`merged`). Conflicts are written as `<<<<<<< yours` / `=======` / `>>>>>>> registry` markers, reported as
`conflict`, and make the command exit 2; resolve them by hand. Either way the registry version becomes the new base, so
afterwards `diff` shows exactly your edits. A file with no base copy cannot be merged (see below) and is skipped.

### index.css

`<css-out>/index.css` is generated from `deep-ink.json`, and protected like any copied file: its hash is recorded under
`generated`, and if you edited it, `add` leaves it alone (exit 2) until you pass `--overwrite`.

### Files an item no longer ships (orphans)

When an item drops a file, `add` reports it (`orphan  path (no longer part of tabs; use --prune to delete)`) and removes
its entry from `deep-ink.json` and its base copy. **It never deletes your file** unless you pass `--prune`, and even then
only when you did not modify it. `status` and `diff` list orphans too.

### markup-only mode (plugins)

`deep-ink add <item…> --framework html --markup-only` copies only the markup: the HTML recipes, plus the element bundles
of element items. It copies no CSS at all (no `tokens.css`, `base.css`, component stylesheets or `index.css`), because
in a Microcks plugin the host owns all design-system CSS and the plugin must not ship its own copy. `tokens` and `base`
are skipped. The mode is stored in `deep-ink.json` (`"markupOnly": true`), and `--markup-only` is refused in a project
that already copies CSS. See [docs/plugins.md](../../docs/plugins.md).

### Projects copied by an older deep-ink

A `deep-ink.json` without `.deep-ink/base` still works: files are classified by the hash in the lockfile, so unmodified
files update as before. What is lost is the base: `diff` shows one combined diff, `--merge` skips files you edited, and the
commands print `base unknown`. Run `deep-ink add <items>` once: files you did not edit are updated and get a base copy;
files you edited need `--overwrite` once (or keep them and merge by hand).

Exit codes: `0` ok, `1` error (or differences with `--exit-code`), `2` some files were skipped, or have merge conflicts.

Output is plain lines (`added  src/components/ui/button.tsx`). Colors are off when `NO_COLOR` is set or stdout is not a TTY.

## Tests

```bash
pnpm --filter @microcks-deep-ink/cli test    # node --test, temp directories
```
