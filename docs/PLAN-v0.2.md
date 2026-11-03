## Summary

The repo moves from "22 Web Components plus generated wrappers" to a shadcn-style copy-paste design system:

- **Natural components** become native HTML styled by a CSS class API with the `di-` prefix.
- **Simple Microcks components** become native React and Angular code over that same CSS. Their Web Component versions are dropped.
- **Three Web Components remain:** `mk-workflow-loom`, `mk-command-bar` and `mk-plugin-slot`. They are compiled into self-contained element bundles that get copied along with a thin wrapper.
- **One registry** in `packages/registry` is the single source of truth. Both the Storybook "Copy" panel and the new zero-dependency CLI (`pnpm deep-ink add …`) read its built JSON.
- **A new clean-architecture demo**, `apps/demo-react`, covers all 17 screens. It uses only components copied by the CLI. It is published under `/demo/`.
- **Accessibility (RGAA 4.1.2 / WCAG 2.1 AA)** is a contract every work package must meet. It is checked by axe-core and `@a11ylint/core@1.0.0-alpha.7` in a Playwright smoke run.
- **Phases:** a coordinator-run bootstrap (phase 0), then 3 parallel work packages, then 6 parallel work packages, then 1 integration package. At most 6 agents run at once.

Things you should know:

1. **I narrowed your list of components that stay Web Components.** ApiBadge, MethodTag, StatusBadge, LiveIndicator, MockUrl, OperationRow, AiGhostRow, DropZone and ConformanceBand become native code only. Keeping them as Web Components would mean three implementations of each (WC, React, Angular). Copied code that needs a compiled bundle is also less shadcn-like, and native markup avoids shadow-DOM limits on ARIA. Plugins get the same look from HTML recipes. This is easy to reverse: register them as element items like the Loom.
2. **The light-theme colors change slightly.** The current light `link`/`action`, `success`, `danger`, `warning`, `running` and `proto-*` values drop to about 4.0–4.46:1 on the `raised` and `selected` surfaces (hovered and selected rows). Dark `border-strong` is 1.6:1, which fails the 3:1 rule for input borders. The plan darkens those light values slightly and adds `border-control` plus four opaque `*-tint` tokens.
3. **a11ylint can't run in a browser as published.** Its `core.ts` imports a report generator that uses `node:fs` and Handlebars. The plan bundles it with esbuild, replacing those modules with empty stubs for the browser run, and generates `audit.md` in Node. Its alpha.7 also runs RGAA 11.1.1/11.1.2 (form labels) even though its README doesn't list them.
4. **Version constraints:**
   - `eslint-plugin-jsx-a11y` 6.10.2 only supports ESLint up to 9, so the plan pins ESLint `^9`.
   - `react-router` 8.5.1 needs React ≥19.2.7. The store already has 19.3.1.
   - npm's `latest` tag for `@a11ylint/core` is the older alpha.1, so the plan pins 1.0.0-alpha.7 exactly.
5. **From your memory:** I used that you maintain Microcks, have an Arazzo POC on the `feature/arazzo` branch of your fork, and that the repo is Apache-2.0 with nothing published to npm. Nothing new needs saving.

**Work packages:**

| Phase | Package | Scope |
| --- | --- | --- |
| 0 | Bootstrap (coordinator) | Branch, deletions, all `package.json` changes, one `pnpm install` |
| 1 | WP1 | Registry tooling, CLI, CSS base, 17 natural items (React + CSS + HTML) |
| 1 | WP2 | Token a11y fixes, 11 content/layout items, 12 Microcks items |
| 1 | WP3 | Demo foundation: all domain types, ports, use-case contracts, composition root, shell, router, dependency rule, tests |
| 1 gate | Coordinator | Build, then copy all natural and Microcks items into the demo |
| 2 | WP4 | Core rewrite: new Loom, accessible CommandBar, light-DOM PluginSlot, element bundles and their items |
| 2 | WP5 | Angular versions of all 40 items, Angular Storybook |
| 2 | WP6 | React Storybook, shared Copy panel, fixtures, demo plugin |
| 2 | WP7 | Demo: Cockpit, Catalogue, Service, Behavior, Copilot, Import, Sources |
| 2 | WP8 | Demo: Workflows, Workflow, WorkflowRun |
| 2 | WP9 | Demo: TestCreate, TestRun, Tests, Usage, Traces, Hub, Admin |
| 3 | WP10 | Integration: CI, site assembly, Playwright smoke with axe and a11ylint, `docs/accessibility.md`, README and docs |

---

# PLAN.md — Deep Ink v0.2: copy-paste registry, native components, Arazzo Loom, clean-architecture demo, RGAA

**Repo:** /home/claude/microcks-deep-ink (pnpm 10, Node 22).
**Branch:** `feat/registry-native-demo`.
**Rules for all agents:**
- English for code and docs.
- Everything stays `private: true` and marked DEMO.
- Apache-2.0.
- Never run `pnpm install` or add dependencies. All dependencies are installed in phase 0. If one is missing, report it.
- Never edit files outside your ownership list.

## 0. Decisions

| # | Decision | Justification |
|---|---|---|
| D1 | **Natural components are native HTML plus a CSS class API.** Each has one root class `di-<name>` on the native element. Variants use `data-*` attributes (`data-variant`, `data-size`, `data-tone`). States use native or ARIA state (`:disabled`, `[aria-invalid="true"]`, `[aria-selected="true"]`, `[aria-current="page"]`, `[aria-pressed="true"]`, `[aria-expanded="true"]`, `[aria-busy="true"]`). | Native semantics come first, which is also the a11y contract. Styling through ARIA state means a state is only visible if it is exposed to assistive technology. |
| D2 | **The prefix is `di-` (Deep Ink) and appears only in CSS classes and Angular selectors.** React components, Angular classes and file names have no prefix (`Button`, `button.tsx`, `ButtonDirective`). | The Microcks v1 UI (PatternFly 3 / Bootstrap) already owns `.btn`, `.table`, `.nav-tabs`, and it will coexist with v2 during migration and inside plugins. A two-letter namespace avoids collisions. It names the design system, not the product, and the repo already uses `di-` for layout utilities. Component names stay free of "Mk". |
| D3 | **Component CSS lives in cascade layers.** `base.css` declares `@layer deep-ink.base, deep-ink.components;`. Each item's CSS is wrapped in `@layer deep-ink.components { … }`. Tokens stay unlayered on `:root`. | Unlayered app CSS always wins, so copied code is easy to override. No `!important`. |
| D4 | **Three tiers.** *natural* = native HTML + CSS, React and Angular are thin. *microcks* = Microcks-specific but presentational: native React/Angular + CSS + an HTML recipe, no Web Component. *element* = a Web Component kept in `packages/core` for complex behaviour: `mk-workflow-loom`, `mk-command-bar`, `mk-plugin-slot`. | A Web Component pays off only when the logic is heavy (Loom layout and SVG, combobox plus global shortcut, plugin host). For badges and rows, the CSS carries the design and the templates are a few lines each. Shadcn-style ownership requires editable source. |
| D5 | **Element tags keep `mk-`.** Wrappers drop it: React `WorkflowLoom`, `CommandBar`, `PluginSlot`. Angular uses a directive whose selector is the tag itself (`mk-workflow-loom`), class `WorkflowLoomDirective`, and the host component sets `CUSTOM_ELEMENTS_SCHEMA`. | Custom element names must contain a hyphen. `mk-` is the Microcks host namespace, which plugins must not use (they use their own `tagPrefix`). |
| D6 | **Angular natural items are attribute directives on native elements** (`button[diButton]`, `a[diButton]`, `input[diInput]`, `table[diTable]`, `dialog[diDialog]`). Composite widgets are standalone components with `di-` element selectors (`di-tabs`, `di-field`, `di-app-shell`). Signal inputs use `input()`, `output()` and `model()`. | This keeps native elements (forms, events, a11y) and follows the Angular Material style. The `di` selector namespace matches the CSS one. |
| D7 | **Copied element code is a self-contained bundle plus a wrapper.** `packages/core` builds `dist/elements/mk-<tag>.js` with esbuild: ESM, self-registering, Stencil runtime included. The registry item copies that file to `<out>/elements/` and adds `workflow-loom.tsx` or `workflow-loom.ts`. | There is one implementation of the Loom and CommandBar (no double maintenance), and copied code has no npm dependency (nothing is published). |
| D8 | **The registry is a flat source tree plus one JSON file per item.** See §3.2. It builds to `dist/registry.json` (index), `dist/registry.full.json` (with file contents, read by the Storybook panel and CLI), and `dist/deep-ink-components.css` (all CSS concatenated, for the Storybooks only). | One source of truth. Per-item JSON files and name-based file discovery mean parallel agents never edit the same file. |
| D9 | **The CLI is `packages/cli`.** Zero dependencies (Node built-ins only). Run it as `pnpm deep-ink …` from the repo root, `node <repo>/packages/cli/bin/deep-ink.mjs …`, or `npx <repo>/packages/cli …`. Commands: `init`, `add`, `list`, `diff`, `view`. A lockfile `deep-ink.json` in the target stores a hash per copied file. **Overwrite policy:** an identical file is skipped. A file unchanged since the last copy is updated silently. A file modified locally is skipped and reported, and the command exits 2, unless `--overwrite`. `--dry-run` writes nothing. | Safe upgrades, never silent loss of local edits, usable in CI. |
| D10 | **The Storybook "Copy" is a manager panel addon** written once in `apps/shared/copy-panel/` and registered by both Storybooks. It is selected by default (`options.selectedPanel`). It reads `parameters.deepInk.items` and `globals`, and shows each file (component, CSS, element bundle note), registry dependencies, Copy buttons and the CLI command. | The manager runs on React in both Storybooks, so one implementation works for both frameworks. It shows the same files the CLI copies. |
| D11 | **`packages/react` and `packages/angular` are deleted.** Stencil's React and Angular output targets are removed. | The generated wrappers lose their purpose. Wrappers are now copyable registry files. |
| D12 | **`mk-plugin-slot` renders contributions in light DOM** (Stencil `scoped: true`, no shadow). Plugins style themselves with the `di-` CSS API, and the HTML recipes are their reference. The plugin SDK is unchanged. | Global tokens and `di-*` classes must reach plugin elements. A shadow root blocks the classes. |
| D13 | **The demo uses a hash router** (`createHashRouter`) with Vite `base: './'`. It is served at `/demo/`. | GitHub Pages has no SPA fallback. |
| D14 | **Accessibility target: RGAA 4.1.2 (≈ WCAG 2.1 AA).** Automated by axe-core (WCAG breadth) and `@a11ylint/core@1.0.0-alpha.7` (RGAA numbering). We never claim conformance. The status is "non audité" (not audited). | User requirement. |

## 1. Target architecture

```
 packages/tokens ─ tokens.json ─► dist/deep-ink.css (+ no-fonts)        packages/plugin-sdk (unchanged)
        │                                                                      │
        │            packages/core (Stencil) ── 3 Web Components ◄────────────┘
        │              mk-workflow-loom · mk-command-bar · mk-plugin-slot
        │              └─ scripts/bundle-elements.mjs ─► dist/elements/mk-*.js (self-contained ESM)
        ▼                                   ▼
 packages/registry  (SINGLE SOURCE OF TRUTH FOR COPYABLE CODE)
   items/<name>.json   src/css/<name>.css   src/react/<name>.tsx   src/angular/<name>.ts   src/html/<name>.html
   scripts/build.mjs ─► dist/registry.json · dist/registry.full.json · dist/deep-ink-components.css · src/*/elements/*
        │                         │                                        │
        ▼                         ▼                                        ▼
 packages/cli              apps/shared/copy-panel (manager addon)    apps/storybook-react / storybook-angular
 `deep-ink init|add|…`     "Copy" panel in both Storybooks           stories import registry source directly
        │
        ▼  copies files (never imports packages)
 apps/demo-react/src/ui/components/ui/*  +  src/ui/styles/*  +  deep-ink.json
   domain ◄── application(ports, use cases) ◄── ui(pages, hooks)        infrastructure/in-memory ──implements──► ports
                      ▲                                                        ▲
                      └──────────── src/composition-root.ts (only place wiring infra to application) ──┘

 tools/a11y: esbuild(a11ylint IIFE) + axe-core + Python Playwright smoke ─► a11y-report/audit.md
 .github/workflows/site.yml: build → test → lint → storybooks → demo → assemble site → a11y smoke → Pages (/, /react, /angular, /demo)
```

### Final repo tree (new or changed items only)

```
.github/workflows/site.yml                 (renamed from storybooks.yml)
docs/architecture.md  docs/accessibility.md  docs/plugins.md  docs/design-principles.md
package.json  pnpm-workspace.yaml (+ tools/*)  .gitignore (+ registry elements, a11y-report, .ngc)
packages/tokens/{tokens.json, build.mjs, test/contrast.test.mjs}
packages/plugin-sdk/                        (unchanged)
packages/core/
  src/components/{mk-workflow-loom,mk-command-bar,mk-plugin-slot}/*.tsx
  src/utils/{types.ts, loom-layout.ts, loom-layout.spec.ts, icons.tsx, parse.ts}
  scripts/bundle-elements.mjs  stencil.config.ts  vitest.config.ts
packages/registry/
  registry.schema.json  README.md (CSS class API reference)
  items/<name>.json
  src/css/  src/react/  src/angular/  src/html/
  scripts/{build.mjs, sync-elements.mjs, a11y-table.mjs}
  test/{element-types.parity.ts, registry.test.ts}
  tsconfig.react.json  tsconfig.angular.json  vitest.config.ts  eslint.config.js
packages/cli/{bin/deep-ink.mjs, src/*.mjs, test/*.test.mjs, README.md, package.json}
apps/shared/{fixtures.ts, demo-plugin.ts, foundations.css, copy-panel/{register.tsx, Panel.tsx, a11y-doc.ts}, package.json}
apps/storybook-react/src/stories/**        apps/storybook-angular/src/stories/**
apps/demo-react/
  index.html vite.config.ts tsconfig.json eslint.config.js .dependency-cruiser.cjs deep-ink.json README.md
  src/main.tsx src/composition-root.ts
  src/domain/{shared,catalog,testing,arazzo,importing,observe,govern,copilot}/
  src/application/{ports,shared,catalog,testing,arazzo,importing,observe,govern,copilot}/ + use-cases.ts
  src/infrastructure/in-memory/{shared,catalog,testing,arazzo,importing,observe,govern,copilot}/
  src/ui/{app,lib,components/ui (CLI OUTPUT),styles (CLI OUTPUT),pages/<screen>/}
tools/a11y/{package.json, build-a11ylint.mjs, src/a11ylint-entry.js, src/collect.js, smoke.py, report.mjs, demo-routes.json, known-issues.json}
tools/site/{index.html, assemble.sh}
DELETED: packages/react/, packages/angular/, 19 component folders of packages/core
```

## 2. Phase 0: bootstrap (coordinator, about 10 min, one commit)

1. `git checkout -b feat/registry-native-demo`.
2. `git rm -r packages/react packages/angular`.
3. `packages/core/stencil.config.ts`: remove the `reactOutputTarget` and `angularOutputTarget` imports and entries.
4. `pnpm-workspace.yaml`: add `- tools/*`.
5. Create or replace these `package.json` files (each `"private": true`, `"license": "Apache-2.0"`, `"type": "module"`):

**`packages/core`**
- Remove the devDependencies `@stencil/react-output-target` and `@stencil/angular-output-target`.
- Add devDependencies `"esbuild": "^0.28.0"`, `"vitest": "^5.1.0"`.
- Scripts: `"build": "stencil build && node scripts/bundle-elements.mjs"`, `"test": "vitest run"`.
- Add export `"./dist/elements/*": "./dist/elements/*"`.

**`packages/registry`** (`@microcks-deep-ink/registry`, version `0.2.0`)
- Exports:
  - `"./react/*": "./src/react/*.tsx"`
  - `"./angular/*": "./src/angular/*.ts"`
  - `"./css/*": "./src/css/*"`
  - `"./html/*": "./src/html/*"`
  - `"./dist/*": "./dist/*"`
- Scripts:
  - `"build": "node scripts/build.mjs"`
  - `"typecheck": "tsc -p tsconfig.react.json && ngc -p tsconfig.angular.json"`
  - `"test": "vitest run"`
  - `"lint": "eslint src"`
- devDependencies:
  - Workspace: `@microcks-deep-ink/core`, `@microcks-deep-ink/tokens` (both `workspace:*`)
  - Tooling: `ajv ^8.20.0`, `typescript ~6.0.0`
  - React: `react ^19.2.7`, `react-dom ^19.2.7`, `@types/react ^19.2.0`, `@types/react-dom ^19.2.0`
  - Angular: `@angular/core`, `common`, `forms`, `compiler`, `compiler-cli`, `platform-browser` (all `^22.2.0`), `rxjs ^7.8.0`, `tslib ^2.8.0`
  - Tests: `vitest ^5.1.0`, `jsdom ^30.1.0`, `@testing-library/react ^16.3.0`, `@testing-library/dom ^10.4.0`, `axe-core 4.14.0`
  - Lint: `eslint ^9.0.0`, `typescript-eslint ^8.72.0`, `eslint-plugin-jsx-a11y ^6.10.2`, `eslint-plugin-react-hooks ^7.1.0`, `@angular-eslint/eslint-plugin-template ^22.6.0`, `@angular-eslint/template-parser ^22.6.0`

**`packages/cli`** (`@microcks-deep-ink/cli`, version `0.2.0`)
- `"bin": { "deep-ink": "./bin/deep-ink.mjs" }`
- Scripts: `"test": "node --test test/"`
- No dependencies.

**`apps/demo-react`** (`demo-react`)
- Dependencies: `react ^19.2.7`, `react-dom ^19.2.7`, `react-router ^8.5.1`
- devDependencies: `vite ^8.3.0`, `@vitejs/plugin-react ^6.2.1`, `typescript ~6.0.0`, `@types/react`, `@types/react-dom`, `vitest ^5.1.0`, `jsdom ^30.1.0`, `@testing-library/react ^16.3.0`, `@testing-library/dom ^10.4.0`, `dependency-cruiser ^18.7.0`, `eslint ^9.0.0`, `typescript-eslint ^8.72.0`, `eslint-plugin-jsx-a11y ^6.10.2`, `eslint-plugin-react-hooks ^7.1.0`
- Scripts:
  - `"dev": "vite"`
  - `"build": "tsc -p tsconfig.json --noEmit && vite build"`
  - `"preview": "vite preview"`
  - `"test": "vitest run"`
  - `"lint": "eslint src"`
  - `"lint:arch": "depcruise src --config .dependency-cruiser.cjs"`
- **No `@microcks-deep-ink/*` dependencies.**

**`tools/a11y`** (`a11y-tools`)
- devDependencies: `"@a11ylint/core": "1.0.0-alpha.7"` (exact pin), `"axe-core": "4.14.0"`, `"esbuild": "^0.28.0"`
- Scripts: `"build": "node build-a11ylint.mjs"`

**`apps/storybook-react`**
- Remove `@microcks-deep-ink/react` and `@microcks-deep-ink/core`.
- Add `"@microcks-deep-ink/registry": "workspace:*"`.

**`apps/storybook-angular`**
- Remove `@microcks-deep-ink/angular` and `@microcks-deep-ink/core`.
- Add `"@microcks-deep-ink/registry": "workspace:*"` and devDependencies `react ^19.2.7`, `@types/react` (types for the manager panel).

**`apps/shared`**
- Dependencies: `@microcks-deep-ink/plugin-sdk`, `@microcks-deep-ink/registry`.
- Exports: add `"./copy-panel": "./copy-panel/register.tsx"`.

**Root scripts**
```
"build": "pnpm -r --workspace-concurrency=1 --filter \"./packages/**\" build",
"build:storybooks": "pnpm --filter storybook-react build-storybook && pnpm --filter storybook-angular build-storybook",
"build:demo": "pnpm --filter demo-react build",
"build:site": "bash tools/site/assemble.sh",
"test": "pnpm -r --if-present test",
"lint": "pnpm --filter @microcks-deep-ink/registry lint && pnpm --filter demo-react lint && pnpm --filter demo-react lint:arch",
"typecheck": "pnpm --filter @microcks-deep-ink/registry typecheck",
"a11y": "pnpm --filter a11y-tools build && python3 tools/a11y/smoke.py --site site --out a11y-report",
"deep-ink": "node packages/cli/bin/deep-ink.mjs"
```

6. `.gitignore`: add `packages/registry/src/react/elements/`, `packages/registry/src/angular/elements/`, `a11y-report/`, `site/`, `.ngc/`, `tools/a11y/dist/`.
7. Run `pnpm install`. If `@vitejs/plugin-react` peer resolution fails, drop it (Vite 8's oxc handles TSX with `oxc.jsx.runtime='automatic'`) and note this for WP3.
8. Commit: `chore: bootstrap registry, CLI, demo and a11y tool packages`. The Storybooks are expected to be broken until phase 2.

## 3. Contracts (all agents must respect these exactly)

### 3.1 Tokens (WP2)

Keep every existing token name. Add:
- `border-control`: dark about `#6A7FA3`, light about `#6B7E9B`. Must be ≥3:1 on bg, canvas, surface and raised in its theme. Used for input, select and checkbox borders.
- `success-tint`, `danger-tint`, `warning-tint`, `info-tint`: opaque hex per theme, used for row and callout backgrounds. No `color-mix` or alpha behind text, which keeps contrast measurable by a11ylint.

Darken light `action`, `link`, `running`, `success`, `danger`, `warning` and `proto-*` minimally so that every text-role token is ≥4.5:1 on `bg`, `canvas`, `surface`, `raised`, `selected` and its own tint. Candidates: success `#17733F`, danger `#B23026`, warning `#875B00`; compute the rest. Dark theme already passes, except `border-strong`, which stays decorative only.

The test `packages/tokens/test/contrast.test.mjs` (`node --test`) asserts:
- Text roles (`text`, `text-secondary`, `text-muted`, `link`, `action`, `success`, `danger`, `warning`, `running`, `live-text`, `proto-*`) are ≥4.5:1 on the five grounds and tints.
- `on-action` on `action` and `on-proto` on `proto-*` are ≥4.5:1.
- `border-control` and `action` (used as the focus outline) are ≥3:1 on all grounds.

### 3.2 Registry format (WP1 defines it; everyone uses it)

**File layout per item `<name>`** (kebab-case). Files are discovered with the regex `^<name>(\.[a-z0-9-]+)*\.(tsx|ts|css|html)$`, excluding `*.spec.*` and `*.stories.*`:
- `items/<name>.json`: metadata (below).
- `src/css/<name>.css`: optional for element items.
- `src/react/<name>.tsx`: React. Siblings are imported relatively (`./icon`, `./copy-button`). Files land flat in the target.
- `src/angular/<name>.ts`: Angular, written in phase 2 by WP5 (or WP4 for element items).
- `src/html/<name>.html`: HTML recipe for plugins and vanilla use. Required for natural and microcks items.
- Element bundles: `items/<name>.json` contains `"elements": ["mk-workflow-loom"]`. The build copies `packages/core/dist/elements/<tag>.js` (+`.d.ts`) into `src/react/elements/` and `src/angular/elements/` (gitignored). The CLI copies them to `<out>/elements/`.

**`items/<name>.json`** (validated by `registry.schema.json` with ajv):
```json
{
  "name": "button",
  "title": "Button",
  "tier": "natural",
  "description": "Sturdy, near-square action. One primary per task region.",
  "registryDependencies": ["base", "icon"],
  "npmDependencies": { "react": [], "angular": [] },
  "elements": [],
  "a11y": {
    "pattern": "Native <button>",
    "keyboard": [["Enter / Space", "Activates the button"]],
    "aria": ["Icon-only buttons need aria-label", "Toggle buttons use aria-pressed"],
    "rgaa": ["7.1", "10.7", "11.9"],
    "wcag": ["2.1.1", "2.4.7", "4.1.2"],
    "notes": "Never use a <div> with a click handler."
  },
  "stories": ["Components/Button"]
}
```
`tier` is one of `natural`, `microcks` or `element`.

**Build outputs** (`node scripts/build.mjs`):
- `dist/registry.json`:
  `{ name, version, items:[{ ...meta, files:{ react:[{target}], angular:[…], html:[…] }, css:[{target}] }] }`
- `dist/registry.full.json`: the same, plus `content` on every file entry, plus a top-level `tokens: { css, cssNoFonts }` copied from `packages/tokens/dist`.
- `dist/deep-ink-components.css`: `base.css` first, then all item CSS in topological order of `registryDependencies`.
- Validation:
  - The build fails on an unknown dependency, a dependency cycle, a missing CSS file for a non-element item, or a schema error.
  - A missing framework folder is a warning, unless `--strict`. Phase 3 runs `--strict`.
  - A missing core element bundle is a warning plus a skip, unless `--strict`.
- Each copied file gets a header:
  - TS: `// Deep Ink · <name>@0.2.0 · copied from packages/registry. You own this file.`
  - CSS: `/* Deep Ink · <name>@0.2.0 … */`
  - HTML: `<!-- … -->`

### 3.3 CLI (WP1)

```
deep-ink init  [--framework react|angular|html] [--out DIR] [--css-out DIR] [--no-fonts] [--cwd DIR] [--yes]
deep-ink add   <item...> | --all [--tier natural,microcks,element] [--framework …] [--out DIR] [--css-out DIR]
               [--overwrite] [--dry-run] [--cwd DIR] [--registry FILE]
deep-ink list  [--framework …] [--tier …] [--json]
deep-ink diff  <item>  [--cwd DIR]       # unified diff, local file vs registry
deep-ink view  <item>  [--framework …]   # prints files
```

- **Framework detection:** `@angular/core` in the target's `package.json` means angular. `react` means react. Otherwise html.
- **Default output folders:**
  - React: `--out src/components/ui`, `--css-out src/styles/deep-ink`
  - Angular: `--out src/app/ui`, `--css-out src/styles/deep-ink`
  - HTML: `--out deep-ink`, `--css-out deep-ink/css`
- **`init`:**
  - Copies `tokens.css` (or the no-fonts variant) and `base.css` into the CSS folder.
  - Writes `<css-out>/index.css`, which contains `@import` lines in dependency order and is rewritten after each `add`.
  - Writes `deep-ink.json`:
    `{ "framework", "out", "cssOut", "registryVersion", "items": { "<name>": { "version", "files": { "<relpath>": "<sha256>" } } } }`
  - Prints the next steps (Angular: add `src/styles/deep-ink/index.css` to `angular.json` styles).
- **`add`:** resolves `registryDependencies` transitively, copies framework files plus CSS plus element bundles, then applies the D9 overwrite policy. Exit codes: 0 = ok, 1 = error, 2 = some files skipped because they were modified locally.
- **Registry location:** defaults to `<cli dir>/../registry/dist/registry.full.json`. If it is missing, exit 1 with "Run `pnpm build` in the Deep Ink repo first."
- **Messages:** plain lines (`added  src/components/ui/button.tsx`, `skip   … (modified locally, use --overwrite or deep-ink diff button)`). No colors when `NO_COLOR` is set or the output is not a TTY.

### 3.4 Item catalogue and component API (React props; Angular mirrors them with signal inputs and outputs)

All React components forward native props and `ref` (React 19 ref-as-prop) to the root native element and merge `className`. The CSS hooks are the contract for plugins and Angular.

**Natural items owned by WP1**

| item | React API | CSS / markup contract |
|---|---|---|
| `tokens` | (CSS only) | `tokens.css` |
| `base` | (CSS only) | Layer order; `:focus-visible{outline:2px solid var(--action);outline-offset:2px;box-shadow:var(--shadow-focus)}`; `.di-sr-only`; `.di-skip-link` (visible on focus); `.di-stack` (column, `--di-gap`); `.di-inline` (row wrap); `@media (prefers-reduced-motion: reduce)` neutralises transitions and animations; body font and colors |
| `icon` | `Icon({name, size=16, label?})`: `aria-hidden` unless `label` (then `role="img"` + `aria-label`); `focusable="false"`. Names: migrate from `core/src/utils/icons.tsx` and add `spark, retry, end, branch, link-out, play, pause, trash, undo, check, cross, dash, warning, info, external, chevron-down, menu, search, close, copy, upload, tests, sun, moon` | `svg.di-icon` |
| `button` | `Button({variant='secondary'\|'primary'\|'ghost'\|'danger', size='md'\|'sm', confirm?, icon?, iconOnly?, loading?, asChild?})`. `iconOnly` requires `aria-label` (dev `console.error` otherwise). `loading` sets `aria-busy` and disables. `ButtonLink` = same styling on `<a>` | `.di-button[data-variant][data-size][data-confirm][data-icon-only]`; md 44px high, sm 32px (sm is never used for a page's primary action) |
| `copy-button` | `CopyButton({value, label='Copy', copiedLabel='Copied', size='sm'})`. Label switches for 2 s. A visually hidden `role="status" aria-live="polite"` announces "Copied". Clipboard failure announces "Copy failed" | `.di-copy-button` (extends `.di-button`) |
| `field` | `Field({label, help?, error?, required?, children:(control:{id,'aria-describedby','aria-invalid',required})=>ReactNode})`. The error shows an icon plus text, never color alone | `.di-field[data-invalid]`, `.di-label`, `.di-required` (`*` with `aria-hidden` plus `required` on the control), `.di-help`, `.di-error` |
| `input` | `Input({mono?, size?})`, `Textarea` | `input.di-input[data-mono]`, `textarea.di-input`; border `--border-control`; `[aria-invalid=true]` uses a danger border |
| `select` | `Select` (native) | `select.di-select` |
| `checkbox` | `Checkbox({label, description?})`, `Radio`, `RadioGroup({legend, options, value, onChange})` (fieldset/legend) | `.di-choice > input.di-checkbox / input.di-radio + span`; `fieldset.di-fieldset > legend` |
| `switch` | `Switch({label, checked, onChange})` | `input[type=checkbox][role=switch].di-switch` |
| `tabs` | `Tabs({label, items:{id,label,count?,disabled?}[], value, onChange, activation='automatic'\|'manual'})` + `TabPanel({id, value, children})`. Keys: ←/→ (wrap), Home/End, Enter/Space in manual mode. Roving `tabindex`. The count is read as "Operations, 4" | `.di-tabs > [role=tablist].di-tablist[aria-label] > button[role=tab].di-tab[aria-selected][aria-controls] > .di-tab-count`; `[role=tabpanel].di-tabpanel[tabindex=0]` |
| `chip` | `Chip({labelKey?, tone?, variant?, pressed?, onRemove?})`. Renders `<span>` when static; `<button aria-pressed>` when `pressed` is defined; the remove button has `aria-label="Remove <text>"` | `.di-chip[data-tone=neutral\|info\|success\|warning\|danger][data-variant=solid\|outline\|dashed]`, `.di-chip-key` |
| `panel` | `Panel({title?, headingLevel=2, actions?, flush?, as='section'})`: `aria-labelledby` points at the title | `.di-panel[data-flush] > .di-panel-header > .di-panel-title + .di-panel-actions`, `.di-panel-body` |
| `table` | `DataTable<T>({caption, captionHidden?, columns:{key,header,align?,mono?,render?,sortable?}[], rows:T[], rowKey, rowHref?(row), selectedKey?, sort?, onSortChange?, emptyText, density?})`. Sortable headers contain a `<button>` and `aria-sort`. With `rowHref`, the first cell holds the link stretched over the row (no clickable `<tr>`). Selected row: `data-selected` + `aria-current="true"` on its link. The scroll wrapper is `role="region" aria-labelledby=<caption id> tabindex=0` | `.di-table-wrap > table.di-table[data-density] > caption`; `th[scope=col]`; `td[data-align=end][data-mono]`; `.di-table-rowlink`; `.di-table-empty` |
| `dialog` | `Dialog({open, onClose, title, description?, children, footer?, size?})`: native `<dialog>.showModal()`, Escape closes (cancel event), focus moves to the first focusable or `[autofocus]`, and returns to the opener when it closes. The close icon button has `aria-label="Close"`. `aria-labelledby` + `aria-describedby` | `dialog.di-dialog > .di-dialog-header/.di-dialog-body/.di-dialog-footer`; `::backdrop` |
| `menu` | `Menu({label, icon?, items:{id,label,onSelect?,href?,danger?,disabled?}[]})`: disclosure pattern with the native `popover` attribute and a `popovertarget` button with `aria-expanded` mirrored. Escape and light dismiss are native. ↑/↓ move between items, Home/End | `button.di-button[aria-expanded] + div.di-menu[popover] > .di-menu-item` |
| `segmented` | `Segmented({label, options:{id,label,count?}[], value, onChange})`: `role="group" aria-label`, buttons with `aria-pressed` (filters such as All/Passed/Failed) | `.di-segmented > button[aria-pressed] > .di-segmented-count` |

**Natural items owned by WP2**

| item | React API | CSS / markup contract |
|---|---|---|
| `callout` | `Callout({tone='info'\|'success'\|'warning'\|'danger'\|'ai', title?, live?:'polite'\|'assertive'\|false, actions?})`. `ai` uses the spark icon and the default title "Generated by AI, review needed" | `.di-callout[data-tone]` |
| `code-block` | `CodeBlock({code \| lines:{text,bad?,note?}[], language?, caption?, copy=true, maxHeight?})`: `<figure>`, `<pre tabindex=0>`. A bad line has a "✕" marker and a visible note, not color alone | `figure.di-code > figcaption, pre > code > .di-code-line[data-bad] .di-code-note` |
| `skeleton` | `Skeleton({lines?, width?})` (`aria-hidden`); the container sets `aria-busy` | `.di-skeleton` (static under reduced motion) |
| `progress` | `Progress({label, value?, max?})` native `<progress>`; `Meter({label, value, min, max, low, high})` | `progress.di-progress`, `meter.di-meter` |
| `kbd` | `Kbd` | `kbd.di-kbd` |
| `link` | `Link({external?})`: always underlined in body text; `external` adds an icon + `.di-sr-only` "(opens in a new tab)" + `rel="noopener"` | `a.di-link[data-external]` |
| `disclosure` | `Disclosure({summary, defaultOpen?})` native `<details>` | `details.di-disclosure > summary` |
| `description-list` | `DescriptionList({items:{term, value, mono?}[]})` | `dl.di-dl > div > dt + dd[data-mono]` |
| `empty-state` | `EmptyState({title, headingLevel=2, children, actions?})` | `.di-empty` |
| `app-shell` | `AppShell({brand, nav:{id,label,href,icon?,badge?}[], activeId, topbarActions?, banner?, skipLinkLabel='Skip to content', children, renderLink?})`. Renders the skip link → `<header class="di-topbar">` (banner) → `<nav class="di-sidenav" aria-label="Main">` (`aria-current="page"` on the active link; below 768px it collapses behind a disclosure button with `aria-expanded`/`aria-controls`) → `<main id="main" tabindex="-1" class="di-main">`. `renderLink(item, props)` lets the demo use router links. Reflows at 320px | `.di-skip-link`, `.di-shell`, `.di-topbar`, `.di-sidenav`, `.di-main` |
| `theme-toggle` | `ThemeToggle()` + `theme.ts` (`getTheme`, `setTheme(theme, persist)`, `restoreTheme`; key `microcks-theme`; sets `document.documentElement.dataset.theme`; dispatches `di-theme-change`). The button is icon-only, `aria-label="Light theme"`, `aria-pressed` | uses `.di-button` |

**Microcks items owned by WP2.** Types are exported from the item file and duplicated where needed: `Protocol = 'REST'|'SOAP'|'EVENT'|'gRPC'|'GRAPHQL'|'DIRECT'`.

| item | React API | CSS / markup contract |
|---|---|---|
| `api-badge` | `ApiBadge({protocol?, arazzo?, name?, version?, label?, value?, status?, size='md'\|'sm'})`. Three segments. The accessible text is the full phrase ("REST API Pastry 2.0", or "ARAZZO restock-pastry"). The Arazzo variant inverts the left segment (`text` fill, `bg` text) and never uses a protocol color | `.di-api-badge[data-protocol=rest\|…\|arazzo][data-status][data-size] > .di-api-badge-type/.di-api-badge-name/.di-api-badge-version` |
| `method-tag` | `MethodTag({method, protocol?})` | `.di-method[data-method]` |
| `status-badge` | `StatusBadge({status:'conformant'\|'failed'\|'partial'\|'running'\|'never', label?})`: icon (✓ ✕ ◐ ⟳ ○) + word, always | `.di-status[data-status]` |
| `live-indicator` | `LiveIndicator({label='live', paused?})`: pink dot (static under reduced motion) + label. Not a live region itself | `.di-live[data-paused]` |
| `conformance-band` | `ConformanceBand({outcomes:('pass'\|'fail'\|'untested')[], size='full'\|'mini'})`: `role="img"` + `aria-label="11 of 12 operations pass, 1 fails"`. Failed segments are hatched as well as colored, and a visible summary appears in `full` | `.di-conformance[data-size] > span[data-result]`, `.di-conformance-summary` |
| `mock-url` | `MockUrl({url, method?, mcpTool?, bare?})` uses `method-tag` + `copy-button` | `.di-mock-url > code` |
| `operation-row` | `OperationList({label})` + `OperationRow({method, path, protocol?, meta?, mockUrl?, selected?, href? \| onSelect?})`: link or button; selected = `aria-current="true"` | `ul.di-operation-list > li.di-operation-row[data-selected]` |
| `ai-ghost-row` | `AiGhostRow({name, children, onAccept, onEdit, onReject, busy?})`: `role="group" aria-label="AI suggestion: <name>"`. Button labels: "Accept <name>", "Edit <name>", "Reject <name>" | `.di-ai-row` |
| `drop-zone` | `DropZone({heading, hint, accept?, multiple?, onFiles})`: a real `<input type=file>` (visually hidden) + a visible "Choose files" button; drag and drop is an enhancement; a live region announces "2 files ready" | `.di-drop-zone[data-dragging]` |
| `step-status` (new) | `StepStatus({status:'passed'\|'failed'\|'not-run', attempts?})` → "✓ Passed", "✕ Failed · 3 attempts", "– Not run" (muted text, dashed, never opacity). `StepChecks({successCriteria, schemaValidation?})`, each `'passed'\|'failed'\|'off'\|'not-evaluated'`, labels **"Success criteria"** and **"Schema validation"** | `.di-step-status[data-status]`; `ul.di-checks > li[data-state]` |
| `run-target` (new) | `RunTarget({target:'mocks'\|'implementations'\|'mixed'})` → "Mocks", "Implementations", "Mixed" + a dashed warning chip "Proposed · beyond POC" for mixed | `.di-run-target[data-target]` |
| `run-origin` (new) | `RunOrigin({origin:'ui'\|'api'\|'mock-url'\|'session', sessionId?})` → "UI", "API", "Mock URL", "Session s-7f3a2c91" | `.di-run-origin[data-origin]` |

**Element items owned by WP4.** These are the registry wrappers plus the core Web Components.

**`workflow-loom`**: `<mk-workflow-loom>`, React `WorkflowLoom`.

Props:
```ts
sources: LoomSource[]; steps: LoomStep[]; threads: LoomThread[];
inputs?: string[]; outputs?: string[];
validatesSchemas?: boolean; selectedStep?: string; label: string;
```
Event: `mkStepSelect` → `{ stepId }`. React: `onStepSelect`.

Types (defined in core `utils/types.ts`, duplicated in the wrappers, kept identical by a parity test):
```ts
type StepStatus = 'passed' | 'failed' | 'not-run';
type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';
interface LoomSource { name: string; type: 'openapi' | 'asyncapi'; protocol: Protocol; linked: boolean }
interface LoomStep {
  stepId: string; source: string; operation: string /* "GET /pastries" */;
  dependsOn?: string[]; status?: StepStatus; attempts?: number;
  checks?: { successCriteria: CheckState; schemaValidation?: CheckState };
  actions?: LoomAction[];
}
type LoomAction =
  | { type: 'end'; name: string; on: 'success' | 'failure'; criteria: string; taken?: boolean }
  | { type: 'retry'; name: string; on: 'failure'; retryAfter: number; retryLimit: number; applied?: boolean };
interface LoomThread { from: string /* stepId | '$inputs' */; to: string /* stepId | '$outputs' */; expression: string }
```
There is **no goto**.

**Layout** is a pure function `layoutLoom(steps)` in `core/src/utils/loom-layout.ts`:
- If no step declares `dependsOn`, steps are sequential (each depends on the previous one).
- If any step declares `dependsOn`, steps without it are roots and run in parallel.
- Column = longest-path depth. Lane = index of the step's source. Sub-row = order among steps with the same lane and column. A lane's height grows with its maximum number of sub-rows.

**Drawing:**
- Lanes: 2px line in the protocol color at reduced opacity, labelled `name · protocol`. An unlinked source shows a "Not linked" label in warning, as text.
- Sequence and join edges: `border-control` curves from each dependency to the dependent step. Parallel branches visibly join.
- Threads: `link` curves, labelled in mono. Focusing or hovering a step highlights its threads and dims the others.
- `end` action: a short exit branch to a terminal mark, labelled `end if <criteria>`. Taken: solid success color. Not taken: dashed muted.
- `retry` action: a loop arc above the node, labelled `retry ×2 · 1 s`. Applied: danger color, weight 600, plus "· 3 attempts".
- Node: `n stepId`, operation, and `StepStatus`-equivalent text. If `validatesSchemas`, it also shows the two checks rows.

**Accessibility:**
- The component is a `role="group"` with `aria-label`.
- Nodes are `<button aria-pressed>`, with roving tabindex: ←/→ move by column, ↑/↓ by lane or sub-row, Home/End.
- Each node's accessible name is "Step 3, patchPastry, PATCH /pastries/{name}, Failed after 3 attempts, Success criteria passed, Schema validation failed".
- The SVG is `aria-hidden`.
- A built-in "Show as table" toggle button (`aria-pressed`) switches to an equivalent `<table>` with columns #, Step, Source, Operation, Depends on, Status, Checks, Actions.
- The loom scrolls horizontally in a focusable `role="region"`.
- No `${}` inside the Stencil `styles` string.

**`command-bar`**: `<mk-command-bar>`, React `CommandBar`.

Props: `items: CommandItem[]`, `open`, `inline`, `placeholder`, `globalShortcut=true`, `label='Command bar'`.
Events: `mkCommand` → `CommandItem`, `mkClose`. React: `onCommand`, `onClose`.

ARIA 1.2 combobox: `input role=combobox aria-expanded aria-controls aria-activedescendant aria-autocomplete=list` + `ul role=listbox` with `li role=option aria-selected`.

Keys: ↑/↓, Home/End, Enter runs the item, Escape closes. Ctrl/⌘K opens (when `globalShortcut`).

The modal mode uses a native `<dialog>.showModal()` inside the shadow root. On open it stores the active element and restores focus on close. Options are grouped by `kind` with `role=group` + `aria-label`. A polite live region announces "5 results". `CommandItem` is unchanged.

**`plugin-slot`**: `<mk-plugin-slot>`, React `PluginSlot` + `getPluginHost()` (re-exported from the bundle, which reads `globalThis.__MICROCKS_PLUGIN_HOST__`).

Props: `point`, `context`, `outlined`. It renders in light DOM (`scoped: true`), wrapping each contribution in `<div class="di-plugin-item" data-plugin-id>`. The fallback slot is kept.

**Angular wrappers** for elements are directives `selector: 'mk-workflow-loom'` with signal inputs written to element properties in an `effect`, and outputs bridged from DOM events. The consumer adds `schemas:[CUSTOM_ELEMENTS_SCHEMA]` (documented in `item.a11y.notes` and in the panel).

### 3.5 Accessibility contract (every work package; RGAA 4.1.2 ≈ WCAG 2.1 AA)

1. **Native semantics first.** A `div`/`span` with a click handler is forbidden. ARIA only where no native element exists.
2. **Visible focus everywhere** through the base `:focus-visible` rule (action outline 2px + shadow-focus). Never `outline:none` without a replacement.
3. **Keyboard:** every interaction works with the keyboard as specified in §3.4. No keyboard trap. Focus order follows DOM order.
4. **Contrast:** text ≥4.5:1 and UI parts ≥3:1 in both themes (the tokens test enforces it). Never put text over alpha or `color-mix` backgrounds; use the tints.
5. **Status is never color-only:** icon plus word (Passed, Failed, Not run; ✓ ✕ –).
6. **Icon-only buttons** have `aria-label`. Decorative icons have `aria-hidden`.
7. **Forms:** visible `<label>`; help and error linked by `aria-describedby`; `aria-invalid`; `required`. Errors are listed in an error summary (`role="alert"`, links to fields) when a form is submitted.
8. **Live regions:** copy feedback, streaming progress (throttled: announce at most every 2 s, or summarise as "Step 3 of 4 running"), result counts after filtering. Live and moving content (Traces, Cockpit ticker, TestRun stream) has a Pause control (RGAA 13.8).
9. **Reduced motion:** all transitions and animations become none under `prefers-reduced-motion: reduce`.
10. **Demo pages:** skip link, banner/nav/main landmarks, exactly one `<h1>` per page, ordered headings, a unique `document.title` per route ("<Page> · Microcks"), focus moved to the `<h1>` (`tabindex=-1`) and announced on route change, `<html lang="en">`.
11. **Primary actions** are ≥44px high. Other targets are ≥24px.
12. **Reflow:** works at 320 CSS px and at 200% zoom with no loss of content. Wide tables, the Loom and code blocks scroll inside focusable regions.
13. **Charts** (Usage, Tests timeline) have an equivalent data table or text summary (RGAA 1.x / 4.x complex images).
14. **Each registry item** fills `a11y` (keyboard, aria, rgaa, wcag). Each story shows it in docs, via the `a11yDoc(item)` helper from the copy panel package.
15. **Lint:** `eslint-plugin-jsx-a11y` (strict) on registry React and the demo. `@angular-eslint/template` accessibility rules (processInlineTemplates) on registry Angular.

### 3.6 Demo contracts (WP3 defines them in phase 1; pages implement them in phase 2)

**Layers and dependency rule** (`apps/demo-react/.dependency-cruiser.cjs`):
- `src/domain/**` imports nothing outside `src/domain` (no npm packages, no React).
- `src/application/**` imports only `src/domain` and `src/application`.
- `src/infrastructure/**` imports `src/domain` and `src/application` (ports). Never `src/ui`.
- `src/ui/**` imports `src/application` (types and the `UseCases` interface), `src/domain` (types and pure functions), `src/ui`, `react`, `react-router`. Never `src/infrastructure`.
- Only `src/main.tsx` and `src/composition-root.ts` may import infrastructure.
- No module may import `@microcks-deep-ink/*`. Copied components live in `src/ui/components/ui`.
- Also forbidden: circular dependencies across features, and `src/domain/<a>` importing `src/domain/<b>`, except from `src/domain/shared`.

**Use-case contract:**
- `src/application/use-cases.ts` exports `interface UseCases { catalog: CatalogUseCases; copilot: CopilotUseCases; importing: ImportingUseCases; testing: TestingUseCases; arazzo: ArazzoUseCases; observe: ObserveUseCases; govern: GovernUseCases }`.
- Each feature folder `src/application/<feature>/index.ts` exports its `<Feature>UseCases` interface and `create<Feature>UseCases(ports: <Feature>Ports): <Feature>UseCases`.
- Use cases are async functions returning domain objects or view DTOs. Streams use `subscribe(listener) => Unsubscribe`.
- **Phase 1 writes every interface and signature**, plus a minimal working implementation over empty or minimal in-memory stubs, so every page renders.
- **Phase 2 owners may add new use cases** inside their own feature interface (additive only) and must not change other features.

**Ports** (`src/application/ports/<feature>.ts`, one file per feature):

| Feature | Ports |
|---|---|
| catalog | `ServiceCatalog` (`list(filter)`, `get(id)`, `operations(id)`, `operation(id, opId)`, `examples(id, opId)`, `addExamples`, `behavior(id, opId)`, `saveBehavior`, `workflowUsages(id)`, `labels()`, `commands()`) |
| copilot | `CopilotGateway` (`suggestExamples(serviceId, opId, {count, hint})`) |
| importing | `ImportGateway` (`analyze(source)`, `import(previewId, options)`, `createDirectApi`); `ImporterRepository`; `SecretRepository` |
| testing | `TestRunRepository` (`listForService`, `get`, `create`, `watch`) |
| arazzo | `ArazzoRepository` (`documents`, `document`, `workflow`, `linkSource`, `validate`); `WorkflowRunRepository`; `WorkflowRunner` (`start(request)` → `runId`, `watch(runId, listener)`); `SessionRepository` |
| observe | `MetricsRepository`; `TraceStream` (`subscribe(filter, listener)`, `replay(callId)`, `get(callId)`); `TrafficStream` (Cockpit) |
| govern | `HubRepository`; `AdminRepository` (users, groups, requests, snapshots, flags) |
| shared | `Clock` (fixed at `2026-11-03T09:10:04Z`) |

**Domain core types** (`src/domain/shared/*`, written by WP3; pages may only add fields that are optional):
```ts
type Protocol = 'REST'|'SOAP'|'EVENT'|'gRPC'|'GRAPHQL'|'DIRECT';
interface ServiceSummary {
  id; name; version; protocol; format; operationCount; exampleCount?;
  lastResults: ('pass'|'fail')[] | null; labels: Label[];
  testStatus: 'passed'|'failed'|'never'; lastTest?: { runId; when: string };
  conformance: number | null; calls24h; updatedAt; mcp: boolean;
}
interface Label { key; value }
interface Operation {
  id; method; path; summary; calls; spark: number[];
  dispatcher: 'URI_PARTS'|'URI_PARAMS'|'JSON_BODY'|'SCRIPT'|'FALLBACK'|…;
  rule; delayMs; mcpTool?;
}
interface Example { id; name; request: {params; body?}; response: {status; body}; aiGenerated?: boolean; reviewState?: 'pending'|'accepted' }
function conformanceScore(results: ('pass'|'fail'|'untested')[]): number | null  // round(100*pass/tested), null if none tested
```

**Domain Arazzo types** (`src/domain/arazzo/*`, written by WP3):
- `ArazzoDocument { id ('pastry'|'beer'); apiId (hex, for the API snippet); file; title; arazzoVersion; version; origin; overlay?; sources: SourceDescription[]; workflowIds; importIssues }`
- `SourceDescription { name; type:'openapi'|'asyncapi'; url; link: {status:'linked', serviceId, protocol, operationsFound} | {status:'not-linked', expectedFile} }`
- `Workflow { workflowId; documentId; summary; inputs: {name; type; example?}[]; steps: Step[]; outputs: {name; expression}[]; mockUrl; runnability: {runnable:true} | {runnable:false; reason:'asyncapi-steps'|'source-not-linked'; message} }`
- `Step { stepId; sourceName; operationId; method; path; description; parameters: {name; in:'path'|'query'|'header'; value}[]; requestBody?; successCriteria: Criterion[]; onSuccess: Action[]; onFailure: Action[]; outputs: {name; expression}[]; dependsOn?: string[] }`
- `Criterion = {type:'simple'; condition} | {type:'regex'; context; condition}`
- `Action = {type:'end'; name; criteria?} | {type:'retry'; name; retryAfter; retryLimit; criteria?}`
- `RunTarget = {kind:'mocks'} | {kind:'implementations'; baseUrls: Record<string,string>} | {kind:'mixed'; perSource: Record<string,'mock'|'implementation'>; proposed: true}`
- `RunOrigin = {kind:'ui'} | {kind:'api'} | {kind:'mock-url'} | {kind:'session'; sessionId; app}`
- `RunOptions { example?; inputs: Record<string,unknown>; secret?; timeoutMs; validateSchemas: boolean }` (default `true`)
- `WorkflowRun { id; number; documentId; workflowId; origin; target; options; status:'RUNNING'|'SUCCESS'|'FAILURE'; startedAt; steps: StepResult[]; outputs: Record<string,unknown>; coherence: MockCoherenceIssue[]; relatedTestRunId? }`
- `StepResult { stepId; status:'passed'|'failed'|'not-run'; attempts: {n; httpStatus; ms; when}[]; request?: {method; url; params; body?}; response?: {meta; lines}; criteria: {condition; kind; evaluation; held}[]; schema: {state:'pass'|'fail'|'off'|'na'; ref; message}; outputs: Record<string,unknown>; flow: {kind:'next'|'end'|'stop'; title; text}; baggage: string }`
- `MockCoherenceIssue { stepId; operationId; missing: string /* e.g. "an example of GetPastryByName for name=Tarte Tatin" */; copilotHint }`
- `Session { id; app; state:'open'|'closed'; openedAt; inputs; failureInjection?; calls: SessionCall[]; verification?: {result; problems: {lead; text}[]} }`

**Pure domain functions** WP3 must deliver with Vitest tests:
- `validatePocSubset(raw)` → `ImportIssue[]`. Refuses goto, jsonpath/xpath criteria, workflowId/operationPath steps, workflow-level dependsOn/successActions/failureActions, `$components` actions, and cookie params.
- `executionLayers(steps)` → `string[][]`. Parallel layers from `dependsOn`, using the same rule as `layoutLoom`.
- `evaluateCriterion(criterion, ctx)` → simple (`==`, `!=`, `<`, `>`) and regex.
- `nextAfterStep(step, result)` → retry, end or next, applying `retryLimit`.
- `baggage(runId, workflowId, stepId, attempt)` → `"microcks-arazzo-run=<id>,microcks-arazzo-workflow=<wf>,microcks-arazzo-step=<step>,microcks-arazzo-attempt=<n>"`.
- `validateRunRequest(form)` → field errors. Includes "Use a dot as decimal separator (3.9): newPrice is a JSON number." and the absolute URL rule, both taken from `WorkflowRun.dc.html`.
- `conformanceScore`.
- `formatRelative(now, date)`.

**Seed ids** (`src/infrastructure/in-memory/shared/seed-ids.ts`, WP3):
- Services: `pastry2, orders, movie, hellogrpc, petstore, pastry1, rocks, usersignedup, hellosoap, beer` (from `Catalogue.dc.html`).
- Mock base: `http://microcks.local:8080/rest/API+Pastry/2.0`. Staging: `https://pastry.staging.acme.io/v2`.
- Operations of pastry2: `get-list`, `get-name`, `patch-name`.
- Arazzo docs: `pastry` (apiId `6728f1c2a4e1b93d5c0e7a14`, `pastry-workflows.arazzo.yaml`, arazzo 1.1.0, overlay `pastry-workflows.arazzo-sources.yaml`) and `beer` (`beer-checkout.arazzo.yaml`, 1.0.1, beerCatalog not linked).
- Workflows: `restock-pastry`, `order-pastry` (AsyncAPI steps, cannot run), `compare-prices`, `check-menu` (step-level dependsOn: listSmall, listMedium and listLarge feed compareSizes), `checkout-beer`.
- Workflow runs:

| Run | Id | Target / origin | Result |
|---|---|---|---|
| #14 | `6729a1d27e4c0b5f93a8c214` | implementations, schema validation on | FAILURE at patchPastry: `price` returned as `"3.9"`, 3 attempts; verifyPastry not run; related test run 119 |
| #13 | `67299b3e1f0a4c7d82e5b106` | session `s-7f3a2c91` | FAILURE |
| #12 | `67290c5a9d3e41b7a6f8e215` | mocks, example `restock-eclair` | SUCCESS |
| #11 | `6728f8d47b2c4e09a1d3c524` | Mock URL | SUCCESS |
| #15 | `6729a3f08b1d6e2c45f7a930` | mocks, ended early | SUCCESS |
| #16 | `6729a4b15c9e7d3a28b0f6e1` | mocks, missing example | FAILURE + coherence issue |
| check-menu #3 | `6728e1a03c9b4f5d87e2a633` | mocks | SUCCESS |

- Test runs: `119` (Failed 6/7 staging, just now), `118` (Passed), `117` (Failed).
- Session: `s-7f3a2c91`.
- Clock now: `2026-11-03T09:10:04Z`.

**Simulated latency:** `latency()` in `in-memory/shared/latency.ts`, default 120–350 ms, deterministic. `?fast` in the hash query or `localStorage['deep-ink-demo-fast']='1'` sets it to 0 (used by the smoke run). Streams tick at 1200 ms, matching the prototypes.

**UI infrastructure** (`src/ui/app/*`, WP3):
- `UseCasesProvider` and `useUseCases()`.
- `useQuery(fn, deps)` → `{status:'loading'|'success'|'error', data, error, reload}`.
- `useSubscription`.
- `usePageTitle(title)` (sets `document.title`, focuses the h1 and announces through the shell's live region).
- `PageHeader({title, eyebrow?, badge?, actions?})` renders the single `<h1 tabindex=-1>`.
- `DemoBanner` ("DEMO · in-memory data, nothing is saved", warning tone, in the top bar on every page).
- `router.tsx` with lazy routes.
- `AppLayout` (built on `AppShell` once copied; nav order from the prototype: Cockpit, APIs & Services, Workflows, Import, Tests, Sources, Usage & conformance, Live traces, Hub, Administration).

**Routes** (hash). Each page module is `src/ui/pages/<folder>/<Name>Page.tsx` with a default export:

| # | Route | Page | Owner |
|---|---|---|---|
| 03 | `/` | cockpit/CockpitPage | WP7 |
| 01 | `/import` | import/ImportPage | WP7 |
| 02 | `/importers` (`/importers/:importerId`) | sources/SourcesPage | WP7 |
| 04 | `/services` | catalogue/CataloguePage | WP7 |
| 05 | `/services/:serviceId/:tab?` (tab: operations, properties, tests; `?op=&example=`) | service/ServicePage | WP7 |
| 06 | `/services/:serviceId/operations/:operationId` | behavior/BehaviorPage | WP7 |
| 07 | `/services/:serviceId/copilot` (`?op=&hint=`) | copilot/CopilotPage | WP7 |
| 15 | `/workflows` | workflows/WorkflowsPage | WP8 |
| 16 | `/workflows/:docId/:workflowId/:tab?` (tab: loom, steps, source, mock-url, sessions, examples, runs; `?run=14&step=patchPastry`) | workflow/WorkflowPage | WP8 |
| 17a | `/workflows/:docId/:workflowId/run` (`?scenario=impl14\|mocksEnd\|mocksMissing`) | workflow-run/RunSetupPage | WP8 |
| 17b | `/workflows/runs/:runId` | workflow-run/WorkflowRunPage | WP8 |
| 08 | `/tests/create` (`?service=`) | test-create/TestCreatePage | WP9 |
| 09 | `/tests/runner/:testRunId` | test-run/TestRunPage | WP9 |
| 10 | `/tests` → redirect to `/tests/service/pastry2`; `/tests/service/:serviceId` | tests/TestsPage | WP9 |
| 11 | `/metrics/:serviceId?` | usage/UsagePage | WP9 |
| 12 | `/traces` (`?run=&service=`) | traces/TracesPage | WP9 |
| 13 | `/hub` (`/hub/:packageId`) | hub/HubPage | WP9 |
| 14 | `/admin/:tab?` (users, groups, secrets, snapshots, config) | admin/AdminPage | WP9 |
| — | `/map` (Parcours screen map) | map/ScreenMapPage | WP3 |
| — | `*` | not-found/NotFoundPage | WP3 |

React Router ranks the static segments `runs`, `run`, `operations` and `copilot` above dynamic ones. Document ids are never `runs`.

## 4. Migration summary

**`packages/core`**
- Delete these 19 components: button, input, tabs, chip, icon, panel, data-table, api-badge, method-tag, status-badge, live-indicator, mock-url, operation-row, ai-ghost-row, drop-zone, conformance-band, app-shell, top-bar, side-nav, theme-toggle.
- Keep and rewrite: workflow-loom, command-bar, plugin-slot.
- Delete `utils/nav.ts`, `utils/theme.ts` and `utils/clipboard.ts` (moved to registry items).
- `index.ts` exports types and `layoutLoom`.
- `global.css` keeps only the token import.

**Other packages and apps**
- `packages/react` and `packages/angular` are removed (phase 0).
- Storybooks:
  - Rewrite all stories against registry source, with new titles: `Foundations/*`, `Components/*`, `Microcks/*`, `Elements/*`, `Patterns/*`, `Plugins/*`.
  - The Copy panel is registered and selected by default.
  - Set `a11y.test: 'error'`.
- `apps/shared`:
  - `fixtures.ts` drops `WorkflowGoto`/`LOOM_GOTOS`, adds `LOOM_RESTOCK_RUN14` and `LOOM_CHECK_MENU`, and gets its types from the registry wrapper files.
  - `demo-plugin.ts` renders HTML recipes (`di-live`, `di-api-badge`) instead of `mk-*` tags.
  - Rename the `foundations.css` classes to `sb-*` to avoid clashing with `base.css`.
- README and docs are rewritten in WP10.
- `plugin-sdk` is unchanged.

## 5. Phases and work packages

```
Phase 0 (coordinator) ─► Phase 1: WP1 ∥ WP2 ∥ WP3 ─► Gate 1 (coordinator) ─► Phase 2: WP4 ∥ WP5 ∥ WP6 ∥ WP7 ∥ WP8 ∥ WP9 ─► Phase 3: WP10
```

**Global rules:**
- No `pnpm install`.
- No edits outside your ownership list. You may read anything.
- Don't run any command that writes into another package's folder. The registry build writes only inside `packages/registry`, which is allowed for anyone.
- Commit only your own paths: `git add <owned paths>`, with message `feat(<wp>): …`. Commit when the coordinator asks, or at the end.
- Report any contract gap in your final report instead of patching someone else's files.

### WP1: Registry tooling, CLI, base and core natural controls (phase 1)

**Owns:**
- `packages/registry/{registry.schema.json, README.md, scripts/**, test/registry.test.ts, tsconfig.*.json, vitest.config.ts, eslint.config.js}`
- `packages/cli/**`
- Items **tokens, base, icon, button, copy-button, field, input, select, checkbox, switch, tabs, chip, panel, table, dialog, menu, segmented**: their `items/<n>.json`, `src/css/<n>.css`, `src/react/<n>.tsx` (+ `<n>.spec.tsx`), `src/html/<n>.html`.

**Inputs:** §3.2–3.5, existing core components (port their visual CSS from the Stencil `styles` strings, replacing `:host` with `.di-<name>`), tokens dist.

**Tasks:**
1. Write the schema, `build.mjs` (discovery, validation, topological sort, outputs, headers) and `sync-elements.mjs`.
2. Typecheck configs:
   - React: `jsx: react-jsx`, `types: []`, includes `src/react/**/*.tsx` and `test/element-types.parity.ts` when present.
   - Angular: `experimentalDecorators`, `strictTemplates`, `noEmit`, includes `src/angular/**/*.ts`. If ngc rejects `noEmit`, set `outDir: .ngc`.
3. Write the 17 items. React components are self-contained and depend only on react plus sibling items.
4. Write Vitest specs (jsdom + Testing Library + axe-core with the `color-contrast` rule disabled in jsdom) for tabs (arrows, Home/End, `aria-selected`), field (`aria-describedby` and `aria-invalid` wiring), dialog (Escape closes, focus returns), copy-button (live region text), table (caption, `th scope`, `aria-sort`), menu (`aria-expanded`). Plus `registry.test.ts`: the build output contains every item, and no item lacks `a11y.keyboard` or `a11y.rgaa`.
5. ESLint flat config: jsx-a11y strict + react-hooks on `src/react`, and angular-eslint template accessibility rules (processInlineTemplates) on `src/angular`.
6. CLI: `bin/deep-ink.mjs` with `parseArgs`, and `src/{registry,resolve,copy,lockfile,detect,diff,log}.mjs`. Tests in `test/*.test.mjs` with `node --test` and temp dirs: init, add with dependencies, identical skip, locally modified skip with exit 2, `--overwrite`, `--dry-run`, Angular detection, missing registry error.
7. `packages/registry/README.md`: CSS class API reference (tables from §3.4, the layer explanation, how to theme). `packages/cli/README.md`: usage.

**Acceptance criteria:**
- `pnpm --filter @microcks-deep-ink/tokens build && pnpm --filter @microcks-deep-ink/registry build` succeeds, with warnings only for items owned by other work packages.
- `pnpm --filter @microcks-deep-ink/registry exec tsc -p tsconfig.react.json` passes.
- `pnpm --filter @microcks-deep-ink/registry test` and `pnpm --filter @microcks-deep-ink/cli test` pass.
- `pnpm --filter @microcks-deep-ink/registry exec eslint src/react` reports 0 errors.
- No CSS file contains `color-mix(`, alpha backgrounds behind text, or `outline: none` without a replacement.
- Every item JSON has a `keyboard` entry (or `[]` for static items with a note), `aria`, and `rgaa`.

**Verify with:**
```bash
pnpm deep-ink list
mkdir -p /tmp/di-try && echo '{"dependencies":{"react":"19"}}' > /tmp/di-try/package.json
pnpm deep-ink init --cwd /tmp/di-try --yes && pnpm deep-ink add tabs --cwd /tmp/di-try
pnpm deep-ink add tabs --cwd /tmp/di-try   # second run: "up to date", exit 0
```

### WP2: Tokens a11y, content and layout items, Microcks items (phase 1)

**Owns:**
- `packages/tokens/**`
- Items **callout, code-block, skeleton, progress, kbd, link, disclosure, description-list, empty-state, app-shell, theme-toggle, api-badge, method-tag, status-badge, live-indicator, conformance-band, mock-url, operation-row, ai-ghost-row, drop-zone, step-status, run-target, run-origin**: same file kinds as WP1.

**Inputs:** §3.1, §3.4, §3.5. The ds2 README and WorkflowLoom README (for step-status wording). The prototypes for visual detail (`Workflow.dc.html`, `WorkflowRun.dc.html`, `Service.dc.html`).

**Tasks:**
1. Tokens: add the new tokens, adjust the light values, add `test/contrast.test.mjs`, and set the tokens `package.json` script `"test": "node --test test/"`.
2. Write the 23 items, using the React files from WP1 by relative import (`./copy-button`, `./icon`, `./chip`). The contracts are fixed, so you can start before WP1 finishes.
3. Specs: app-shell (skip link targets `#main`, `aria-current`, nav disclosure), conformance-band (label text), status-badge and step-status (word present), drop-zone (input reachable, live text), ai-ghost-row (button names include the item name).

**Acceptance criteria:**
- `pnpm --filter @microcks-deep-ink/tokens build && pnpm --filter @microcks-deep-ink/tokens test` passes.
- Registry build, `tsc -p tsconfig.react.json`, registry Vitest and eslint pass for your files.
- Every status-like component renders a word.
- The app-shell reflows at 320px (verify manually in a quick Vite page or Storybook in phase 2; note the result).

**Verify with:** the same commands as WP1, plus `pnpm --filter @microcks-deep-ink/tokens test`.

### WP3: Demo foundation (phase 1)

**Owns, in `apps/demo-react` (excluding `src/ui/components/ui`, `src/ui/styles`, `deep-ink.json`):**
- `index.html`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.dependency-cruiser.cjs`, `README.md`
- `src/main.tsx`, `src/composition-root.ts`
- `src/domain/**`, `src/application/**`
- `src/infrastructure/in-memory/shared/**` + a stub `index.ts` per feature
- `src/ui/app/**`, `src/ui/lib/**`
- `src/ui/pages/map/**`, `src/ui/pages/not-found/**`
- Placeholder `src/ui/pages/<folder>/<Name>Page.tsx` for every route in §3.6. **Ownership of each placeholder transfers to its phase-2 owner.**

**Inputs:** §3.6. Prototypes: Parcours (routes, screen map), Catalogue (services), Workflows, Workflow and WorkflowRun (Arazzo data and semantics).

**Tasks:**
1. Vite config: `base: './'`, alias `@` → `src`, `@vitejs/plugin-react`. `index.html`: `<html lang="en">`, `<meta name="robots" content="noindex,nofollow">`, title "DEMO · Microcks UI v2".
2. Write the domain types and pure functions from §3.6, each with Vitest specs:
   - `executionLayers(check-menu)` returns `[[listSmall, listMedium, listLarge], [compareSizes]]`.
   - `validatePocSubset` refuses each listed feature.
   - The retry and end logic reproduces run #14 (patchPastry fails after 3 attempts, verifyPastry not run) and #15 (`end` on getPastry because `status == 'available'`).
   - `validateRunRequest` with `"3,9"`.
   - `baggage`, `conformanceScore`.
3. Write all ports and use-case interfaces, plus `create<Feature>UseCases` with simple working implementations. Write in-memory stub adapters per feature that return seeded summaries:
   - `shared/services.seed.ts`: the 10 services from Catalogue.
   - `shared/seed-ids.ts`, `FixedClock`, `latency`, `createStream<T>()` helper.
4. `composition-root.ts` builds `UseCases` from `createInMemory<Feature>Adapters()` in each `infrastructure/in-memory/<feature>/index.ts`. The signatures are fixed now; the bodies are filled in phase 2.
5. `ui/app`: providers, hooks, `PageHeader`, `DemoBanner`, `router.tsx`, `AppLayout`. Use raw markup with the `di-` classes from §3.4 (copied components don't exist yet). The layout must already have the skip link, landmarks, the live region for route announcements, and a theme restore on boot.
6. `ScreenMapPage` (`/map`): the Parcours phases, each screen linking to its route. `NotFoundPage`.
7. `.dependency-cruiser.cjs` with the rules in §3.6 (`forbidden`, severity `error`). ESLint: jsx-a11y strict + react-hooks. `README.md` explains the layers, the dependency rule, how to run, and that `src/ui/components/ui` is CLI output.

**Acceptance criteria:**
- `pnpm --filter demo-react test` passes with at least 15 tests.
- `pnpm --filter demo-react lint:arch` reports 0 violations.
- `pnpm --filter demo-react exec tsc -p tsconfig.json --noEmit` passes.
- `pnpm --filter demo-react build` passes: every route renders a placeholder with an h1 and a title.
- `grep -r "@microcks-deep-ink" apps/demo-react/src` finds nothing.

**Gate 1 (coordinator, after WP1–WP3):**
```bash
pnpm build                  # tokens, plugin-sdk, core (old components), registry
pnpm deep-ink init --cwd apps/demo-react --framework react --out src/ui/components/ui --css-out src/ui/styles --yes
pnpm deep-ink add --all --tier natural,microcks --cwd apps/demo-react
```
Then import `./ui/styles/index.css` in `main.tsx` (one line, done by the coordinator) and run `pnpm --filter demo-react build`. Commit: `chore: copy registry items into demo`.

### WP4: Core Web Components and element items (phase 2)

**Owns:**
- `packages/core/**`
- Registry items **workflow-loom, command-bar, plugin-slot** (`items/*.json`, `src/react/<n>.tsx`, `src/angular/<n>.ts`, `src/html/<n>.html`)
- `packages/registry/test/element-types.parity.ts`
- **The right to run the CLI** against `apps/demo-react` for the element tier only.

**Inputs:** §3.4 element contracts, ds2 WorkflowLoom README + `preview.html`, `Workflow.dc.html` (loom geometry, labels and lens behavior).

**Tasks:**
1. Delete the 19 components listed in §4. Rewrite `utils/types.ts` (Loom types, `CommandItem`, `Protocol`, `PROTOCOL_TOKEN`). Add `loom-layout.ts` + specs: sequential, check-menu parallel join, unknown dependsOn ignored with a warning.
2. Rewrite `mk-workflow-loom` and make `mk-command-bar` accessible as specified. Switch `mk-plugin-slot` to scoped light DOM. Avoid `${}` in `styles`.
3. `scripts/bundle-elements.mjs`: for each tag, run esbuild with entry `dist/components/<tag>.js`, a wrapper calling `defineCustomElement()`, bundle, ESM, minified, written to `dist/elements/<tag>.js`, plus a one-line `.d.ts`.
4. Registry wrappers (React with ref, properties set in `useLayoutEffect`, events through `addEventListener`, and the JSX intrinsic declaration in the file; Angular directive) and HTML recipes. The parity test asserts the wrapper types equal the core types.
5. At the end: `pnpm --filter @microcks-deep-ink/core build && pnpm --filter @microcks-deep-ink/registry build`, then `pnpm deep-ink add workflow-loom command-bar plugin-slot --cwd apps/demo-react`.

**Acceptance criteria:**
- Core builds and `pnpm --filter @microcks-deep-ink/core test` passes.
- `dist/elements/` contains 3 files, each importable alone in a blank HTML page (smoke test with Python Playwright on a `file://` or `http.server` page you create under `packages/core/scripts/` — no new files outside your ownership).
- Loom: no goto anywhere; restock-pastry run #14 shows a retry loop labelled `retry ×2 · 1 s · 3 attempts`, an end branch "end if $response.body#/status == 'available'" marked not taken, verifyPastry "Not run", and the two checks labelled "Success criteria" / "Schema validation"; check-menu shows 3 parallel branches joining at compareSizes; the table toggle works; every node is reachable with the arrow keys.
- CommandBar passes the ARIA combobox keyboard checklist.
- Registry typecheck passes, including the parity test.

**Verify with:**
```bash
pnpm --filter @microcks-deep-ink/core build && pnpm --filter @microcks-deep-ink/core test
pnpm --filter @microcks-deep-ink/registry build && pnpm --filter @microcks-deep-ink/registry typecheck
```

### WP5: Angular versions and Angular Storybook (phase 2)

**Owns:**
- `packages/registry/src/angular/*.ts` for all natural and microcks items (40 files; not the element wrappers)
- `apps/storybook-angular/**`

**Inputs:** §3.4 (mirror the React APIs as `input()`, `output()`, `model()`), D6, the HTML recipes from WP1/WP2, and the copy-panel contract from WP6: `import { registerCopyPanel } from '@microcks-deep-ink/storybook-shared/copy-panel'` with `registerCopyPanel({ framework: 'angular' })`, and stories set `parameters.deepInk = { items: ['button'] }`.

**Tasks:**
1. Write the Angular items: directives for single native elements, components for composites. Use `ChangeDetectionStrategy.OnPush`, standalone, no NgModules. Field links ids through an injected `FieldComponent`. Tabs use roving tabindex with `host` listeners. Dialog uses `ElementRef<HTMLDialogElement>` and returns focus.
2. Angular Storybook:
   - Remove `@microcks-deep-ink/angular` imports.
   - Stories import `@microcks-deep-ink/registry/angular/<n>`.
   - `angular.json` styles: tokens CSS + `node_modules/@microcks-deep-ink/registry/dist/deep-ink-components.css` + shared `foundations.css`.
   - `.storybook/tsconfig.json` includes `../../../packages/registry/src/angular/**/*.ts` (keep `types: []`).
   - `manager.ts` registers the copy panel.
   - `preview.ts`: `a11y: { test: 'error' }`, `globals.framework = 'angular'`, `document.documentElement.lang='en'`, and `options.selectedPanel: 'deep-ink/copy'`.
3. Write one story file per item, or grouped as in the current titles: `Components/<Title>`, `Microcks/<Title>`, `Elements/<Title>` (using the WP4 Angular wrappers + `CUSTOM_ELEMENTS_SCHEMA`), `Patterns/Service page`, `Patterns/Workflow run #14`, `Plugins/*`, `Foundations/*`. Every story has a render template (known gotcha), and each meta sets `parameters.deepInk.items` and `parameters.docs.description.component = a11yDoc('<item>')`.

**Acceptance criteria:**
- `pnpm --filter @microcks-deep-ink/registry exec ngc -p tsconfig.angular.json` passes with `strictTemplates`.
- `pnpm --filter storybook-angular build-storybook` passes.
- Every item has at least one story, and every story has `deepInk.items`.
- The angular-eslint a11y template rules report 0 errors.

### WP6: React Storybook, shared copy panel, fixtures and demo plugin (phase 2)

**Owns:**
- `apps/storybook-react/**`
- `apps/shared/**`

**Tasks:**
1. `apps/shared/copy-panel/register.tsx`:
   - `registerCopyPanel({framework})` registers `addons.add('deep-ink/copy', { type: types.PANEL, title: 'Copy', render })`.
   - The panel imports `@microcks-deep-ink/registry/dist/registry.full.json` and reads `useParameter('deepInk')`.
   - It lists the requested items with their dependencies resolved. For each: tabs per file (component, CSS, elements note), a `<pre>` with an accessible Copy button and a live region, the dependency list, and the CLI commands (`pnpm deep-ink add <items> --framework <fw>` and `npx <path-to-repo>/packages/cli add …`).
   - Keyboard accessible, with visible focus.
2. `a11y-doc.ts`: `a11yDoc(name)` returns markdown with the pattern, a Keyboard table, ARIA and RGAA/WCAG references.
3. Rewrite `fixtures.ts` per §4, with realistic data (run #14, check-menu, services, commands, operations). Rewrite `demo-plugin.ts` with HTML recipes. Rename the foundations classes to `sb-*`.
4. React Storybook:
   - Stories import `@microcks-deep-ink/registry/react/<n>` and `@microcks-deep-ink/registry/dist/deep-ink-components.css`.
   - `preview.tsx` drops `@microcks-deep-ink/react` (use the theme util from the theme-toggle item) and sets the same parameters as WP5 with `framework: 'react'`.
   - `manager.ts` registers the panel.
   - Stories mirror WP5's set and titles exactly (same story ids, so the smoke and docs line up).
5. Keep `Plugins/*` stories working with `PluginSlot` (element wrapper from WP4) and `demoPlugin`.

**Acceptance criteria:**
- `pnpm --filter storybook-react build-storybook` passes.
- The panel shows the source for every story, and the Copy button works (clipboard is mocked in the smoke).
- Panel and stories have 0 axe serious/critical violations in a local run (`npx http-server` is not available, so use `python3 -m http.server -d apps/storybook-react/storybook-static 7001` + the WP10 smoke script once it exists, or a quick Playwright check).

### WP7: Demo screens — Explore and Enrich (phase 2)

**Owns:**
- `src/ui/pages/{cockpit,catalogue,service,behavior,copilot,import,sources}/**`
- `src/domain/{catalog,copilot,importing}/**` (additive)
- `src/application/{catalog,copilot,importing}/**` (additive)
- `src/infrastructure/in-memory/{catalog,copilot,importing}/**`

### WP8: Demo screens — Arazzo (phase 2)

**Owns:**
- `src/ui/pages/{workflows,workflow,workflow-run}/**`
- `src/domain/arazzo/**` (additive, after WP3)
- `src/application/arazzo/**`
- `src/infrastructure/in-memory/arazzo/**`

### WP9: Demo screens — Test, Observe and Govern (phase 2)

**Owns:**
- `src/ui/pages/{test-create,test-run,tests,usage,traces,hub,admin}/**`
- `src/domain/{testing,observe,govern}/**`
- `src/application/{testing,observe,govern}/**`
- `src/infrastructure/in-memory/{testing,observe,govern}/**`

**Rules shared by WP7–WP9:**
- Read each screen's `*.dc.html` prototype (both the markup and the `x-dc` script). Port its data constants into `infrastructure/in-memory/<feature>/seed/*.ts` and its interactions into the use cases and page state.
- Use only `@/ui/components/ui/*` components and `@/ui/app` hooks. Never edit copied files; report needed changes instead.
- Every page: one `PageHeader` h1, `usePageTitle(<prototype <title>>)`, loading skeletons with `aria-busy`, an error state, and an empty state where the prototype has one.
- Vitest: at least 2 use-case tests per screen with the in-memory adapters.
- Each feature's `createInMemory<Feature>Adapters()` signature stays as WP3 defined it.
- Cross-feature reads go only through the ports in `src/application/ports/*` (owned by WP3, read-only now).

**Acceptance criteria for WP7–WP9:**
- `pnpm --filter demo-react test && pnpm --filter demo-react lint && pnpm --filter demo-react lint:arch && pnpm --filter demo-react build` all pass.
- Each of your routes works with the keyboard alone: tab through it, and every action is reachable.
- Each route has 0 axe serious/critical violations in a quick local Playwright run.
- Each listed key interaction (§6) is reproduced.

## 6. Screen-by-screen breakdown

In this section, "uc" means use case.

**WP7**

- **Cockpit `/`**
  - Use cases: `observe.getCockpit()` composes the service catalog, test runs and the traffic stream through ports. `observe.subscribeTraffic()`.
  - KPI tiles. Live wall of API badges with protocol filter chips (`aria-pressed`) and counts. Live traffic ticker with Pause/Resume (13.8). Recent tests with StatusBadge. Onboarding checklist (done states, empty mode toggle). Conformance mini-bands.
  - Optional: `<PluginSlot point="cockpit.widgets">`.
- **Import `/import`**
  - Use cases: `importing.analyze`, `importing.import`, `importing.createDirectApi`.
  - Tabs File / URL / Git repository / Direct API. DropZone. Kind (openapi…). Primary/secondary artifact switch. Steps idle → analyzing (progress, live) → preview (detected services and operations) → importing → done (link to the service). Direct API form (REST/GENERIC_EVENT, name, version, resource) with Field validation. Copyable CLI snippet.
- **Sources `/importers`**
  - Use cases: list, get, `runImporter` (stream), toggle, delete and `undoDelete`, `getDiff`.
  - JOBS from the prototype: `beer-catalog` is running. Status filter (Segmented), search. Selected importer detail with sync timeline. Diff between two versions (CodeBlock with added and removed lines marked by text +/−). Activate/deactivate (Switch). Run now. Delete with a confirmation Dialog, then an Undo callout. Secret reference link to `/admin/secrets`.
- **Catalogue `/services`**
  - Use cases: `catalog.listServices(filter)`, `catalog.labels()`.
  - Search. Protocol chips. Label chips. Test status Segmented. View table ⇄ badge wall (Segmented). DataTable (caption, row links to the service, ConformanceBand mini, StatusBadge). Result count in a live region. Empty filter state with Reset.
- **Service `/services/:serviceId/:tab?`** (pastry2 is rich; other services show a summary)
  - Header with ApiBadge, labels, MockUrl, actions Menu (⋯ copy id, run test → `/tests/create?service=…`, open Copilot).
  - Tabs Operations / Properties & MCP / Tests.
  - Operations: OperationList (selected via `?op`), an examples list (`?example`), request and response CodeBlocks, snippet Tabs curl / HTTPie / MCP tool call with Copy, a pending AI example (Tartelette Framboise) as AiGhostRow accept/reject, "Used by workflows" links to `/workflows/pastry/restock-pastry`, a link to Behavior.
  - Properties & MCP: DescriptionList plus the "Agent-ready" MCP tools list.
  - Tests: runs #119/#118/#117 linking to the test runner.
- **Behavior `/services/:serviceId/operations/:operationId`**
  - Use cases: `catalog.behavior`, `catalog.saveBehavior`, `catalog.simulate`. `simulate` uses the pure domain `dispatch(request, behavior, examples)`.
  - Dispatcher choice (radio cards), rules, delay, parameter constraints, stateful toggle. A request simulator: type a path or params and see which example answers, or a "no example matches" callout.
- **Copilot `/services/:serviceId/copilot`**
  - Use cases: `copilot.generate`, `accept`, `reject`, `export`.
  - Operation picker. Count. Hint (prefilled from `?hint=`, e.g. "Tarte Tatin" when coming from the WorkflowRun coherence link). Generate (latency, progress live). Review list of AiGhostRows. Export Dialog (YAML/JSON CodeBlock + Copy). Dismissible workflow hint callout.

**WP8**

- **Workflows `/workflows`**
  - Use cases: `arazzo.listDocuments`, `arazzo.listWorkflows(filter)`, `arazzo.linkSource`.
  - Documents grouped, with file, Arazzo version, origin and the ArazzoSources overlay name.
  - Source chips linked/not linked (beerCatalog in warning with the text "Not linked").
  - Search. Result Segmented (All/Passed/Failed/Never run) with counts. Target filter (Any/Mocks/Implementations/Mock URL/Session).
  - Per workflow: ApiBadge `arazzo`, summary, mini step-status strip of the last run (text alternative "4 steps: passed, passed, failed, not run"), RunTarget/RunOrigin of the last run, Mock URL note, block chips ("Cannot run yet: AsyncAPI steps", "Not linked") with their reason text.
  - "Link a source" Dialog for beerCatalog (pick an API).
  - Loading skeleton and onboarding empty state with the sample YAML.
- **Workflow `/workflows/:docId/:workflowId/:tab?`**
  - Use cases: `getWorkflow`, `listRuns`, `getRun`, `validateDocument`, `listSessions`, `openSession`, `verifySession`, `listExamples`, `getMockUrl`.
  - Header: ApiBadge arazzo, document, actions Menu (copy workflowId, Mock URL, Run → `…/run`).
  - Tabs:
    - **Loom:** run picker (#14/#13/#12/#11 as Segmented, with origin), run summary callout ("Run #14 failed · Stops at patchPastry · schema validation, 3 attempts"), WorkflowLoom with `validatesSchemas` for runs that validated, selected step from `?step`. The side Panel shows params with expressions, criteria, actions (retry and end, described in words), outputs, the checks for the selected run, the attempts list and messages. Thread lens list.
    - **Steps:** a DataTable equivalent.
    - **Source:** CodeBlock YAML with Disclosure folding, a "Validate the document" button (validating → "validated just now"), and a list of features refused at import.
    - **Mock URL:** MockUrl (POST), a curl CodeBlock, the last call note.
    - **Sessions:** list (s-7f3a2c91). Open session form (size, newPrice, failure injection at step + example). The calls DataTable, including the unexpected call `GET /pastries?size=XL → 400`. Verification problems callout. `x-microcks-session` header shown in a snippet.
    - **Examples:** restock-eclair and already-available from the overlay (inputs, expected steps).
    - **Runs:** DataTable of runs with an origin filter, linking to `/workflows/runs/:runId`.
  - The order-pastry page shows AsyncAPI steps with the block reason. Run is disabled with an explanation.
- **WorkflowRun setup `/workflows/:docId/:workflowId/run`**
  - Use cases: `arazzo.getRunSetup`, `arazzo.startRun`; validation via domain `validateRunRequest`.
  - Workflow Select (non-runnable workflows show their note).
  - Target RadioGroup: Mocks / Implementations / Mixed. Mixed carries the dashed "Proposed · beyond POC" chip and per-source mock/implementation radios.
  - Base URL per source, with validation messages from the prototype. Secret Select (`pastry-staging-oauth`). Example Select or "Detached" with manual inputs size/newPrice. Checkbox "Validate each response against its OpenAPI schema" (checked by default). Timeout (ms).
  - The error summary appears on submit.
  - API equivalent CodeBlock `POST /api/arazzo/documents/{id}/workflows/{wf}/runs` with a JSON body + Copy.
  - `?scenario=` presets impl14, mocksEnd and mocksMissing.
  - Submit navigates to the run page.
- **WorkflowRun `/workflows/runs/:runId`**
  - Use cases: `arazzo.watchRun`, `arazzo.getRun`.
  - Running: steps progress every 1.2 s with LiveIndicator + Pause of the visual stream, and a throttled live summary.
  - Done: summary (SUCCESS/FAILURE, RunTarget, RunOrigin, clock "Nov 3, 2026 09:10:04").
  - Per-step Disclosure: request URL, params with expressions, body template → value, attempts (66/58/61 ms), response CodeBlock with the bad `price` line plus the note "schema: number", criteria evaluations (`$statusCode = 200` Passed), StepChecks, the schema message, outputs, the flow note, the baggage CodeBlock + "Open in Live traces" (`/traces?run=<runId>`).
  - Mock coherence callout (#16): names the missing example and offers the button "Generate the example with the AI Copilot" → `/services/pastry2/copilot?op=get-name&hint=Tarte%20Tatin`.
  - "Same bug as test run #119" → `/tests/runner/119`.
  - Workflow outputs DescriptionList.

**WP9**

- **TestCreate `/tests/create`**
  - Use cases: `testing.getCreateForm`, `testing.create`; domain `buildCiSnippet`.
  - Service picker (Select with ApiBadge preview). Endpoint. Runner RadioGroup with descriptions (`OPEN_API_SCHEMA`…). Timeout. Secret. Operations subset (Checkboxes). OAuth2 client credentials Disclosure (token URI, client id, client secret, scopes). Headers add/remove rows (with labels "Header 1 name"). CI snippet Tabs CLI / GitHub Actions, updated live + Copy.
  - Submit navigates to `/tests/runner/<new id>`.
- **TestRun `/tests/runner/:testRunId`**
  - Use cases: `testing.get`, `testing.watch`.
  - #119 streams 7 steps (tick 1.2 s, Pause) with per-operation groups.
  - Select a step to see the contract vs actual diff, line by line, with violations: `$.price` (the string "2.6" where a number is expected), `$.status` enum `sold-out`, raw message Disclosure.
  - CI toggle snippet. A ConformanceBand summary.
- **Tests `/tests/service/:serviceId`**
  - Use cases: `testing.listForService(filter)`, `testing.timeline`.
  - Runs DataTable (selected 117), filters result / runner / endpoint, "Show all" (LIMIT/CAP). Conformance timeline chart (SVG, `role="img"` + summary) with an equivalent table. Per-operation result matrix.
- **Usage `/metrics/:serviceId?`**
  - Use cases: `observe.invocations(service, period)`, `observe.conformanceByDomain`.
  - Service Select. Period Segmented. Hourly bars, calendar heatmap and domain treemap, each with a "Show data table" Disclosure and keyboard-selectable bars and days (buttons) that update a detail panel. Conformance score Meter.
- **Traces `/traces`**
  - Use cases: `observe.subscribeTraces(filter)`, `replay`, `get`.
  - Live call list (seq) with Pause/Resume and Clear. Filters service / protocol / status + "Arazzo only" Switch (calls with microcks-arazzo baggage; prefilled from `?run=`). Select a call to see request, response and the answering example (link to `/services/pastry2/operations?…`). Replay (count, flash with reduced-motion fallback). A polite live region announces counts at most every 5 s.
- **Hub `/hub`**
  - Use cases: `govern.listPackages`, `getPackage`, `install`.
  - Search. Categories. Package list (selected "banking"). Detail with badge preview, version Select, install mode (sync / one-shot) and role. Install → installing (progress) → installed. "API Pastry" is already installed, with a link to the catalogue.
- **Admin `/admin/:tab?`**
  - Use cases: users, `setRole`, groups, `saveMembers`, `approveRequest`, secrets CRUD, `exportSnapshot`, flags.
  - Tabs Users / Groups (pending dot announced as "2 pending requests") / Secrets / Snapshots / Configuration. User role Select per row. Group members draft + Save/Cancel. Secrets table with masked values + create Dialog (token/basic/oauth types). Snapshot export (choose services → JSON CodeBlock download simulated). Feature flag Switches. Toast feedback as a `role=status` callout.

## 7. WP10: Integration (phase 3)

**Owns:**
- Root `package.json` scripts
- `.github/**` (rename the workflow to `site.yml`)
- `tools/**`
- `README.md`, `docs/**`
- `apps/demo-react/{src/ui/app/**, src/main.tsx}` (ownership transferred back for final wiring)
- Re-running the CLI into the demo

**Tasks:**
1. `pnpm build` (registry `--strict`), then `pnpm deep-ink add --all --cwd apps/demo-react --overwrite`. Switch `AppLayout` to the copied `AppShell` + `ThemeToggle` + `CommandBar` (commands from `catalog.commands()`, plus navigation to every route).
2. `tools/site/index.html`: the landing page, DEMO-marked, `lang`, title, h1, links to `./react/`, `./angular/`, `./demo/`. `tools/site/assemble.sh` copies the Storybook statics and `apps/demo-react/dist` into `site/{react,angular,demo}`.
3. `tools/a11y`:
   - `src/a11ylint-entry.js`: `import Core from '@a11ylint/core'; window.__a11ylint = { run: o => new Core().run(o) }`.
   - `build-a11ylint.mjs`: esbuild IIFE, `platform: 'browser'`, with a plugin that resolves `node:fs`, `node:path`, `node:url` and `handlebars` to empty stub modules. Output `dist/a11ylint.iife.js`.
   - `src/collect.js` (injected) collects, including open shadow roots:
     - `images`: `img`, `area`, `svg` not inside `[aria-hidden=true]`
     - `frames`: `iframe`, `frame`
     - `links`: `a[href]`
     - `formFields`: `input:not([type=hidden])`, `select`, `textarea`
     - `headings`: `h1`–`h6`, `[role=heading]` (pages only)
     - `colorsElements`: `{foregroundElement, backgroundElement}` for elements with direct non-empty text nodes, where the background is the nearest ancestor with an opaque `background-color`
     
     It then runs `mode:'dom'`. For Storybook stories, it drops the page-level rules `RGAA - 8.*` and `RGAA - 9.*`.
   - `smoke.py` (Python Playwright, Chromium):
     - Serves `--site` with `http.server` in a thread.
     - Visits `/index.html`, every story in `/react/index.json` and `/angular/index.json` (`iframe.html?id=…&viewMode=story`), and every route in `demo-routes.json` (`/demo/#/…?fast` with concrete ids: `/`, `/import`, `/importers`, `/services`, `/services/pastry2`, `/services/pastry2/properties`, `/services/pastry2/tests`, `/services/pastry2/operations/get-name`, `/services/pastry2/copilot?op=get-name`, `/workflows`, `/workflows/pastry/restock-pastry` + each tab, `/workflows/pastry/check-menu`, `/workflows/pastry/order-pastry`, `/workflows/pastry/restock-pastry/run`, `/workflows/runs/6729a1d27e4c0b5f93a8c214`, `/workflows/runs/6729a4b15c9e7d3a28b0f6e1`, `/tests/create`, `/tests/runner/119`, `/tests/service/pastry2`, `/metrics/pastry2`, `/traces`, `/hub`, `/admin`, `/admin/secrets`, `/map`).
     - Checks both themes (an init script sets `localStorage['microcks-theme']` and the Storybook `globals=theme:light`).
     - Waits for network idle plus 800 ms. Collects console errors (ignoring `ERR_TUNNEL_CONNECTION_FAILED` and fonts.googleapis/gstatic failures).
     - Injects `axe.min.js` and runs the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`. Injects the a11ylint IIFE + `collect.js`.
     - Writes `out/results.json`, `out/axe-summary.md` and screenshots of failures.
     - **Exits 1** on any page error, console error, axe violation with impact serious or critical, or any a11ylint result, unless matched in `known-issues.json`. Each entry there has `{tool, rule, urlPattern, reason, finding}`, and every entry must be justified.
   - `report.mjs results.json`: `new Core().generateAudit({ results, options: { markdown: true, json: true, baseUrl: 'a11y-report/audit' } })`. Check where alpha.7 writes `audit.md` and move it to `a11y-report/audit.md`.
   - **If a11ylint misbehaves in the browser** (false positives from contrast parsing, decorative SVGs, a crash): record a finding in `docs/accessibility.md` "Tool findings" with a reproduction. Do not patch `/home/claude/a11ylint/core`. Fall back to virtual mode for that rule (serialize `VirtualContrastsElement` or `SvgImageArea` from the page) or skip it with `// TODO(a11ylint#…)`, so CI stays meaningful.
4. CI `site.yml`:
   - checkout → pnpm → node 22 → `pnpm install --frozen-lockfile` → `pnpm build` → `pnpm typecheck` → `pnpm test` → `pnpm lint` → `pnpm build:storybooks` → `pnpm build:demo` → `pnpm build:site`
   - `actions/setup-python@v5` (3.12) → `pip install playwright==1.63.0` → `python -m playwright install --with-deps chromium` → `pnpm a11y`
   - `actions/upload-artifact@v4` (`a11y-report`, `if: always()`) → `upload-pages-artifact` (`site`) → deploy (non-PR).
5. Docs:
   - `README.md`: tiers, copy-paste flow, CLI quick start, Storybook and demo links (`/demo/`), DEMO warnings, nothing on npm.
   - `docs/architecture.md`: decisions D1–D14, diagram.
   - `docs/plugins.md`: light-DOM slot, HTML recipes, `mk-` is reserved.
   - `docs/design-principles.md`: tokens additions.
   - `docs/accessibility.md`:
     - Target RGAA 4.1.2 ≈ WCAG 2.1 AA, and the §3.5 contract.
     - Per-component mapping table to RGAA themes (images, colors, tables, links, scripts, mandatory elements, structure, presentation, forms, navigation, consultation), generated by `packages/registry/scripts/a11y-table.mjs` from `items/*.json`.
     - Automation coverage. a11ylint: 1.1.1, 1.1.2, 1.1.5, 2.1.1, 2.2.1, 3.2.1–3.2.4, 6.2.1, 8.1.1, 8.1.3, 8.3, 8.5, 9.1.1, 9.1.3, 11.1.1/11.1.2 (alpha.7 runs RGAA11 although its README omits it; verify). axe: WCAG rules, which map partially to RGAA themes 1, 3, 5, 6, 7, 8, 9, 11, 12. Manual: everything else, notably 7.1/7.3 behavior, 10.7 focus visibility review, 10.11 reflow, 12.8 order, 13.8, and screen-reader passes with NVDA+Firefox and VoiceOver+Safari.
     - Known limits.
     - Tool findings.
     - A draft "Déclaration d'accessibilité" (in French, as the official model requires): état de conformité **non audité**, technologies used, list of automated tests, no claim of conformance without a human audit, and a contact placeholder.
     - Verify every RGAA criterion number against the official list at accessibilite.numerique.gouv.fr before publishing.

**Acceptance criteria (final):**
```bash
pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm test && pnpm lint
pnpm build:storybooks && pnpm build:demo && pnpm build:site && pnpm a11y   # exit 0
```
- `a11y-report/audit.md` exists.
- The site contains `index.html`, `react/`, `angular/` and `demo/`, and the demo works under `/demo/` with deep links.
- Every story has a working Copy panel.
- `grep -rn "gotos\|WorkflowGoto\|MkButton\|@microcks-deep-ink/react\|@microcks-deep-ink/angular" --include=*.ts* --include=*.md .` returns nothing (excluding `node_modules` and the lockfile).
- No `package.json` loses `"private": true`.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Concurrent `pnpm install` corrupts the lockfile | All dependencies are added in phase 0. Installs are forbidden afterwards. |
| Two agents edit the same file | Per-item JSON files and name-based discovery. Feature-sliced demo folders. CLI output is written only by the gate, WP4 (element tier) and WP10. Placeholder ownership transfers explicitly. |
| Phase-2 work depends on files still being written (element wrappers, Angular files) | Contracts are fixed in §3. The registry build tolerates missing framework folders until `--strict` in phase 3. WP7–WP9 start on non-Loom parts first. |
| The manager panel needs React inside the Angular Storybook | Storybook's manager bundles React globally. `react` types are added to storybook-angular devDependencies. Fallback: render the panel with `storybook/internal/components` only. |
| `@vitejs/plugin-react` peer issues with Vite 8 | Drop it and use Vite 8's oxc JSX transform. |
| ngc rejects `noEmit` | Emit to the gitignored `.ngc/`. |
| eslint-plugin-jsx-a11y does not support ESLint 10 | Pin ESLint `^9`. |
| a11ylint imports `node:fs` and is alpha | Browser bundle with stubs; Node-side report; virtual-mode fallback; known-issues file with justifications; findings documented, never patched upstream. |
| a11ylint contrast with alpha or transparent backgrounds | Opaque tint tokens, a background resolver in `collect.js`, no `color-mix` behind text. |
| Stencil `${}` in styles; story render gotchas | Restated in WP4 and WP5 tasks. |
| Shadow DOM hides elements from a11ylint | `collect.js` walks open shadow roots. The Loom has a table alternative. |
| Light-theme token changes alter the brand perception | Minimal darkening, enforced by the contrast test. Flagged to the maintainer as a design decision. |
| Prototype files are huge (Workflow 173 KB) | WP8 owns only 3 screens. Agents extract constants with a script rather than reading the files fully. |
| Live demo content overwhelms screen readers | Throttled live regions and Pause controls (13.8). |
| Hash routes and static segments collide (`runs`, `run`) | Domain invariant: document ids never equal `runs`. React Router ranks static segments higher. Covered by a routing test in WP3. |

## Critical files for implementation

- `/home/claude/microcks-deep-ink/packages/registry/scripts/build.mjs` (new, WP1): the registry single source of truth and output format.
- `/home/claude/microcks-deep-ink/packages/cli/bin/deep-ink.mjs` (new, WP1): copy-paste distribution.
- `/home/claude/microcks-deep-ink/packages/core/src/components/mk-workflow-loom/mk-workflow-loom.tsx` (WP4): the Arazzo Loom rewrite (no goto, dependsOn branches, end and retry, checks).
- `/home/claude/microcks-deep-ink/apps/demo-react/src/application/use-cases.ts` and `src/composition-root.ts` (new, WP3): the demo's clean-architecture contract.
- `/home/claude/microcks-deep-ink/tools/a11y/smoke.py` (new, WP10): axe + a11ylint RGAA gate.
- Reference prototypes: `/tmp/claude-0/-home-claude/58064407-1f28-5b5e-be19-86480618fa23/scratchpad/proto/project/Workflow.dc.html`, `/tmp/claude-0/-home-claude/58064407-1f28-5b5e-be19-86480618fa23/scratchpad/proto/project/WorkflowRun.dc.html` and `/tmp/claude-0/-home-claude/58064407-1f28-5b5e-be19-86480618fa23/scratchpad/ds2/project/components/WorkflowLoom/README.md`.

## Addendum A (coordinator, 2026-11-03): a11ylint runner, skill-ready (applies to WP10)

These requirements arrived after the plan was written. They extend WP10 and override it where they differ.

1. **Standalone runner, not glue code.** The RGAA check lives in `tools/a11y/rgaa-audit.mjs` with a stable CLI:
   `node tools/a11y/rgaa-audit.mjs --url <url|file> | --urls-from <storybook index.json|routes.json> --format json|md --out <dir>`.
   Exit code is non-zero when any tested criterion is non-compliant. `tools/a11y/smoke.py` (Playwright) and CI call this runner; they do not reimplement it.
2. **Criteria map as data.** `tools/a11y/rgaa-criteria.json` lists the RGAA 4.1.2 criteria (id, theme, title) with `automatedBy: "a11ylint" | "axe" | "manual"`. Coverage grows by editing this file, not code.
3. **Stable JSON output.** Per URL, each criterion with status `compliant | non-compliant | not-applicable | not-tested-automatically`, the offending elements and a fix hint. "Not tested automatically" must never be reported as compliant.
4. **Skill-ready.** `tools/a11y/README.md` documents inputs, outputs, exit codes and the JSON schema, so a future Claude skill can wrap the runner ("run a11ylint, list RGAA criteria and their status").
5. **Upstream findings.** Every bug or missing rule hit in `@a11ylint/core@1.0.0-alpha.7` goes to `docs/a11ylint-findings.md`, written as a ready-to-file issue (title, RGAA criterion, minimal repro HTML, expected vs actual). Never patch the upstream package; stub or skip with a TODO so CI stays meaningful.
6. **docs/accessibility.md** lists, per criterion, whether a11ylint, axe or a human checks it, and states the demo is "non audité" until a human audit.
