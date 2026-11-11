# Microcks Deep Ink

> **DEMO.** A design system proposal for the Microcks UI v2. Not an official Microcks release. **Nothing is published on npm**: every package is `private`. The demo site assembles a landing page, three Storybooks and clickable React and Svelte demos.

The **Microcks UI v2 design system**, a proposal for the maintainers, packaged for reuse by the Microcks UI and by marketplace plugins.

> The contract is the source of truth; the interface makes it alive.

| Demo site | URL (after the first Pages deploy) |
| --- | --- |
| Landing page | https://sebastiendegodez.github.io/microcks-deep-ink/ |
| Clickable demo, 19 screens (React) | https://sebastiendegodez.github.io/microcks-deep-ink/demo/ |
| Clickable prototype, 19 journey entries (Svelte) | https://sebastiendegodez.github.io/microcks-deep-ink/demo-svelte/ |
| React Storybook | https://sebastiendegodez.github.io/microcks-deep-ink/react/ |
| Angular Storybook | https://sebastiendegodez.github.io/microcks-deep-ink/angular/ |
| Svelte Storybook (in progress) | https://sebastiendegodez.github.io/microcks-deep-ink/svelte/ |

The Svelte Storybook is included in the Pages assembly and is published after
this change is merged and the main deployment succeeds. The Svelte clickable
prototype imports its native components via `workspace:*`, with simulated
in-memory interactions; full React behavioral/pixel parity is not claimed.
See [the Svelte demo README](svelte/apps/demo/README.md).

Every page is marked **DEMO**, the data is in memory and nothing is saved. Accessibility target: RGAA 4.1.2 (about WCAG 2.1 AA), status **not audited**, see [docs/accessibility.md](docs/accessibility.md).

## The idea: copy the code, own the code

Deep Ink works like shadcn/ui for Angular, plain HTML and CSS: you do not install a component library; you **copy the
source** of the components you need into your app and edit it. **React does not copy**: React apps add the
`@microcks/deep-ink` package (`react/packages/deep-ink`, built from a clone, see [react/README.md](react/README.md)) and
import it. Three tiers:

| Tier | What it is | What you copy |
| --- | --- | --- |
| **natural** | Native HTML styled by a CSS class API (`button`, `field`, `input`, `tabs`, `table`, `dialog`...) | CSS + a thin Angular file (React: in the package) |
| **microcks** | Microcks-specific but presentational (`api-badge`, `status-badge`, `operation-row`, `conformance-band`...) | CSS + Angular file + HTML recipe (React: in the package) |
| **element** | Two Web Components kept for heavy logic: `<workflow-loom>` (Arazzo) and `<plugin-slot>` | A self-contained bundle + a thin Angular wrapper (React: `WorkflowLoom`, `PluginSlot` in the package) |

Plain class names, no prefix: `.button`, `.tabs`, `.sr-only`, `.skip-link`; custom properties are `--action`, `--surface`...
Angular alone keeps a `mk-` selector prefix (`<mk-tabs>`, `<button mkButton>`) because the Angular style guide and its lint
rules require one; the reasoning is in the Angular Storybook introduction and at the top of `base.css`. There is no CSS
prefix option (`--css-prefix` was rejected): isolation comes from the cascade layers `@layer deep-ink.base, deep-ink.components`,
so unlayered app CSS always wins. The command bar is native React and Angular code, not a Web Component.

## Architecture (v0.2)

```
 packages/tokens ── tokens.json ──► dist/deep-ink.css                       packages/plugin-sdk
        │                                                                          │
        │           packages/core (Stencil): <workflow-loom> <plugin-slot>
        │             └─ esbuild ─► dist/elements/{workflow-loom,plugin-slot}.js (self-contained ESM)
        ▼                                   ▼
 packages/registry   SINGLE SOURCE OF TRUTH FOR COPYABLE CODE
   items/<name>.json   src/css/<name>.css   src/angular/<name>.ts   src/html/<name>.html
   (React sources: react/packages/deep-ink/src/<name>.tsx, in the React workspace)
   build ─► dist/registry.json · dist/registry.full.json · dist/deep-ink-components.css
        │                          │                                   │
        ▼                          ▼                                   ▼
 packages/cli               apps/shared/copy-panel              react/apps/storybook · apps/storybook-angular
 deep-ink init|add|...      "Copy" panel in both Storybooks     stories import the registry source directly
        │
        ▼ Angular, HTML and CSS apps copy files      React apps (and the demo) import @microcks/deep-ink (react/)
 apps/demo-react: `link:` to react/packages/deep-ink, `@/ui/components/ui/<item>` aliased to the package
   domain ◄── application (ports, use cases) ◄── ui (pages)      infrastructure/in-memory ──implements──► ports
                              ▲                                             ▲
                              └────── composition-root.ts (the only wiring) ┘

 tools/a11y   a11ylint (RGAA) + axe-core + Playwright ─► a11y-report/        tools/site   assembles the Pages site
```

| Folder | What it is |
| --- | --- |
| `packages/tokens` | Design tokens: `tokens.json`, `deep-ink.css` (dark Deep Ink and light Paper), contrast test |
| `packages/core` | The two Web Components (Stencil) and their self-contained bundles |
| `packages/registry` | The registry: 46 items (CSS, React, Angular, HTML recipes, accessibility contract). See its [README](packages/registry/README.md) for the CSS class API |
| `packages/cli` | `deep-ink`, a zero-dependency CLI that copies items into an app. See its [README](packages/cli/README.md) |
| `packages/plugin-sdk` | Plugin manifest, extension points, shared plugin host |
| `react/apps/storybook`, `apps/storybook-angular` | The two Storybooks, each with a Copy panel (React: the `@microcks/deep-ink` package docs) |
| `apps/demo-react` | The clickable demo: 19 screens, clean architecture, built on the `@microcks/deep-ink` React package |
| `svelte/apps/demo` | The Svelte clickable prototype: 19 journey entry points, native workspace library, simulated interactions |
| `tools/a11y` | The RGAA audit runner and the accessibility smoke run |
| `tools/site` | The landing page and the script that assembles the Pages site |

## Copy components into your app

Build the registry once (nothing is on npm), then use the CLI from the repo root or from anywhere:

```bash
pnpm install && pnpm build                       # tokens, elements, registry JSON, CLI

pnpm deep-ink list                               # items, tiers, frameworks
pnpm deep-ink init --cwd ../my-app               # tokens.css, base.css, index.css, deep-ink.json
pnpm deep-ink add button tabs field --cwd ../my-app
pnpm deep-ink add workflow-loom --cwd ../my-app  # element tier: also copies elements/workflow-loom.js
pnpm deep-ink diff button --cwd ../my-app        # your edits vs the registry
pnpm deep-ink add --all --cwd ../my-app          # everything; modified files are skipped (exit 2) unless --overwrite
```

The framework (Angular or plain HTML) is detected from the target `package.json`. In a React project the CLI copies
nothing and prints `pnpm add @microcks/deep-ink` and the imports instead. `add` resolves dependencies,
copies the files with a header, and records a hash of each file in `deep-ink.json` so an upgrade never overwrites your edits
silently. Details and exit codes: [packages/cli/README.md](packages/cli/README.md).

**From Storybook:** in the Angular Storybook every story has a **Copy** panel (selected by default) listing the exact files
the CLI would copy, the registry dependencies, a Copy button per file and the matching `pnpm deep-ink add ...` command; the
React Storybook panel shows the `@microcks/deep-ink` import (and the HTML recipe). The demo uses the
React package, `@microcks/deep-ink`; its `@/ui/components/ui/<item>` imports resolve to it (Vite alias and tsconfig paths).

```tsx
import { Button } from '@/ui/components/ui/button';
import { Tabs, TabPanel } from '@/ui/components/ui/tabs';

<Button variant="primary">Run test</Button>
```

```html
<!-- plain HTML or a plugin: same CSS, no JavaScript -->
<button class="button" data-variant="primary">Run test</button>
```

Theme: dark by default; `document.documentElement.dataset.theme = 'light'` switches to Paper (the `theme-toggle` item
does this and persists it under the key `microcks-theme`, dispatching `microcks-theme-change`).

## Plugins

See [docs/plugins.md](docs/plugins.md): manifest, backend and frontend parts, extension points, the light-DOM
`<plugin-slot>`, and the CSS rule plugins must follow.

## Accessibility

RGAA 4.1.2 / WCAG 2.1 AA is a contract for every component (keyboard model, ARIA, contrast in both themes, focus,
reduced motion). It is checked by unit tests, lint, axe-core and `@a11ylint/core` over every story and demo route in both
themes. These checks find some failures; they do not prove conformance, and **the status is "non audité"**. See
[docs/accessibility.md](docs/accessibility.md) and [tools/a11y/README.md](tools/a11y/README.md).

## Develop

```bash
pnpm install
pnpm build                 # tokens → plugin-sdk → core (+ element bundles) → registry → cli
pnpm test                  # tokens, core, registry, cli, demo
pnpm lint && pnpm typecheck
pnpm storybook:react       # http://localhost:6006
pnpm storybook:angular     # http://localhost:6007
pnpm demo:svelte           # http://127.0.0.1:5174/ (build/install the Svelte workspace first)
pnpm build:storybooks && pnpm -C svelte build:storybook && pnpm build:demo && pnpm build:demo:svelte && pnpm build:site   # → site/
pnpm a11y                  # needs: pip install playwright==1.63.0 && python -m playwright install chromium
```

Requirements: Node 22+, pnpm 10. The CI workflow (`.github/workflows/storybooks.yml`) runs the same sequence and
deploys to GitHub Pages only from `main`.

## Roadmap

- **Svelte** is announced as the next target: the registry format will accept a third framework (`svelte` files next to
  `react` and `angular`), reusing the same CSS and HTML recipes.
- A human accessibility audit, then a real "déclaration d'accessibilité".

## Source

Design source: the *Microcks Deep Ink* design system (tokens, principles, component specs) prepared for the
Microcks v2 UI proposal. Design rules live in [docs/design-principles.md](docs/design-principles.md); the
decisions of this version in [docs/PLAN-v0.2.md](docs/PLAN-v0.2.md).

## License

Apache License 2.0, the same license as Microcks (see [LICENSE](LICENSE)).

`Microcks` and its logo are trademarks of the Microcks project (CNCF); this design system is a proposal and does not grant any right to use them.
