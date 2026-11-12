# Microcks UI v2 · DEMO (Svelte)

The Svelte 5 flavour of the clickable demo. It is being ported to match the reference demo's
19 journey screens (`apps/demo-react`), using the same shared code:

| Package | Consumed for | How |
|---|---|---|
| `@microcks/deep-ink` | every design-system component and its CSS | `workspace:*` (this isolated workspace) |
| `@microcks/demo-core` | domain, use cases, in-memory adapters, presentation helpers | `link:` to `packages/demo-core` (built) |
| `@microcks/demo-styles` | page stylesheets and the brand logo | `link:` to `packages/demo-styles` |

No component implementation, use case or page CSS is copied into the demo: `src/` only holds the
composition root, the shell and the page compositions.

```
src/
  composition-root.ts   use cases over the in-memory adapters
  main.ts               mounts <App> with the hash router
  ui/app/               shell, hash router, page header, loading/error states, hooks (query, focus, title)
  ui/pages/<family>/    one folder per screen family
```

```sh
# From the repository root, after the shared tokens/elements/CSS build:
pnpm -C svelte install --frozen-lockfile
pnpm -C svelte build
pnpm demo:svelte                     # builds @microcks/demo-core, then http://127.0.0.1:5174/
pnpm build:demo:svelte               # svelte/apps/demo/dist/
pnpm -C svelte --filter demo-svelte test
pnpm -C svelte check:boundaries
```

`#/map` links to all 19 screens. The hash router follows the reference demo's data router: the URL
changes when the next page module has loaded, a link to the current page replaces the history entry,
and a route change moves focus to the new page `<h1>` and announces its title.

**Text nodes.** Svelte merges adjacent text and `{expressions}` into a single text node, where the
reference demo creates one text node per JSX child, and Chrome lays out each text node on its own
subpixel grid. To render the same pixels, separate the runs with an empty comment, exactly where the
reference JSX has a boundary: `Step {n} · {name}` is written `Step <!---->{n}<!----> · <!---->{name}`,
and `priority:{' '}{list}.` is written `priority:<!----> <!---->{list}<!---->.`. `svelte.config.js`
keeps comments for the files of `src/` only.

**Port in progress.** Screens are ported family by family, each one checked against the reference
demo with strict screenshot comparisons (0 pixel of difference, no mask). A screen that is not ported
yet renders a placeholder with its title.

The shell, explore, service, agents, sources, tests, observe, Hub and Administration pages are
ported. The workflow list, workflow details, run setup and run details are still pending.

Every screen is marked DEMO; nothing is published on npm. Runtime and build guards reject React.
Accessibility status: **not audited** (RGAA 4.1.2 / WCAG 2.1 AA target).
