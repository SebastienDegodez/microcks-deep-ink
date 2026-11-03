# Microcks Deep Ink

> **DEMO.** A design system proposal for the Microcks UI v2. Not an official Microcks release. **Nothing is published on npm**: every package is `private`. Only the demo site (landing page, two Storybooks and a clickable demo) is online.

The **Microcks UI v2 design system**, a proposal for the maintainers, packaged for reuse by the Microcks UI and by marketplace plugins.

> The contract is the source of truth; the interface makes it alive.

| Demo site | URL (after the first Pages deploy) |
| --- | --- |
| Landing page | https://sebastiendegodez.github.io/microcks-deep-ink/ |
| Clickable demo, 17 screens (React) | https://sebastiendegodez.github.io/microcks-deep-ink/demo/ |
| React Storybook | https://sebastiendegodez.github.io/microcks-deep-ink/react/ |
| Angular Storybook | https://sebastiendegodez.github.io/microcks-deep-ink/angular/ |

Every page is marked **DEMO**, the data is in memory and nothing is saved. Accessibility target: RGAA 4.1.2 (about WCAG 2.1 AA), status **not audited**, see [docs/accessibility.md](docs/accessibility.md).

## The idea: copy the code, own the code

Deep Ink works like shadcn/ui. You do not install a component library; you **copy the source** of the components you need
into your app and edit it. Three tiers:

| Tier | What it is | What you copy |
| --- | --- | --- |
| **natural** | Native HTML styled by a CSS class API (`button`, `field`, `input`, `tabs`, `table`, `dialog`...) | CSS + a thin React or Angular file |
| **microcks** | Microcks-specific but presentational (`api-badge`, `status-badge`, `operation-row`, `conformance-band`...) | CSS + React or Angular file + HTML recipe |
| **element** | Three Web Components kept for heavy logic: `<workflow-loom>` (Arazzo), `<command-bar>`, `<plugin-slot>` | A self-contained bundle + a thin wrapper |

Plain class names, no prefix: `.button`, `.tabs`, `.sr-only`, `.skip-link`; custom properties are `--action`, `--surface`...
Angular alone keeps a `mk-` selector prefix (`<mk-tabs>`, `<button mkButton>`) because the Angular style guide and its lint
rules require one; the reasoning is in the Angular Storybook introduction and at the top of `base.css`.

## Architecture (v0.2)

```
 packages/tokens ── tokens.json ──► dist/deep-ink.css                       packages/plugin-sdk
        │                                                                          │
        │           packages/core (Stencil): <workflow-loom> <command-bar> <plugin-slot>
        │             └─ esbuild ─► dist/elements/{workflow-loom,command-bar,plugin-slot}.js (self-contained ESM)
        ▼                                   ▼
 packages/registry   SINGLE SOURCE OF TRUTH FOR COPYABLE CODE
   items/<name>.json   src/css/<name>.css   src/react/<name>.tsx   src/angular/<name>.ts   src/html/<name>.html
   build ─► dist/registry.json · dist/registry.full.json · dist/deep-ink-components.css
        │                          │                                   │
        ▼                          ▼                                   ▼
 packages/cli               apps/shared/copy-panel              apps/storybook-react · apps/storybook-angular
 deep-ink init|add|...      "Copy" panel in both Storybooks     stories import the registry source directly
        │
        ▼ copies files (the demo never imports a package)
 apps/demo-react/src/ui/components/ui + src/ui/styles + deep-ink.json
   domain ◄── application (ports, use cases) ◄── ui (pages)      infrastructure/in-memory ──implements──► ports
                              ▲                                             ▲
                              └────── composition-root.ts (the only wiring) ┘

 tools/a11y   a11ylint (RGAA) + axe-core + Playwright ─► a11y-report/        tools/site   assembles the Pages site
```

| Folder | What it is |
| --- | --- |
| `packages/tokens` | Design tokens: `tokens.json`, `deep-ink.css` (dark Deep Ink and light Paper), contrast test |
| `packages/core` | The three Web Components (Stencil) and their self-contained bundles |
| `packages/registry` | The registry: 43 items (CSS, React, Angular, HTML recipes, accessibility contract). See its [README](packages/registry/README.md) for the CSS class API |
| `packages/cli` | `deep-ink`, a zero-dependency CLI that copies items into an app. See its [README](packages/cli/README.md) |
| `packages/plugin-sdk` | Plugin manifest, extension points, shared plugin host |
| `apps/storybook-react`, `apps/storybook-angular` | The two Storybooks, each with a Copy panel |
| `apps/demo-react` | The clickable demo: 17 screens, clean architecture, built only from copied components |
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

The framework (React, Angular or plain HTML) is detected from the target `package.json`. `add` resolves dependencies,
copies the files with a header, and records a hash of each file in `deep-ink.json` so an upgrade never overwrites your edits
silently. Details and exit codes: [packages/cli/README.md](packages/cli/README.md).

**From Storybook:** every story has a **Copy** panel (selected by default) listing the exact files the CLI would copy,
the registry dependencies, a Copy button per file and the matching `pnpm deep-ink add ...` command. The demo is the
proof: `apps/demo-react/src/ui/components/ui` is CLI output.

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
pnpm build                 # tokens → plugin-sdk → core (+ element bundles) → registry (strict) → cli
pnpm test                  # tokens, core, registry, cli, demo
pnpm lint && pnpm typecheck
pnpm storybook:react       # http://localhost:6006
pnpm storybook:angular     # http://localhost:6007
pnpm build:storybooks && pnpm build:demo && pnpm build:site   # → site/
pnpm a11y                  # needs: pip install playwright==1.63.0 && python -m playwright install chromium
```

Requirements: Node 22+, pnpm 10. The CI workflow (`.github/workflows/storybooks.yml`) runs the same sequence and
deploys to GitHub Pages only from `main`.

## Roadmap

- **Svelte** is announced as the next target: the registry format will accept a third framework (`svelte` files next to
  `react` and `angular`), reusing the same CSS and HTML recipes.
- Optional `--css-prefix` in the CLI for third-party apps that want the Microcks look next to other styles.
- A human accessibility audit, then a real "déclaration d'accessibilité".

## Source

Design source: the *Microcks Deep Ink* design system (tokens, principles, component specs) prepared for the
Microcks v2 UI proposal. Design rules live in [docs/design-principles.md](docs/design-principles.md); the
decisions of this version in [docs/PLAN-v0.2.md](docs/PLAN-v0.2.md).

## License

Apache License 2.0, the same license as Microcks (see [LICENSE](LICENSE)).

`Microcks` and its logo are trademarks of the Microcks project (CNCF); this design system is a proposal and does not grant any right to use them.
