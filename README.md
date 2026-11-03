# Microcks Deep Ink

> **DEMO.** A design system proposal for the Microcks UI v2. Not an official Microcks release. **Nothing is published on npm**: all packages are marked `private`. Only the demo Storybooks are online.

The **Microcks UI v2 design system**, a proposal for the maintainers, packaged for reuse by the Microcks UI and by marketplace plugins.

> The contract is the source of truth; the interface makes it alive.

| Demo Storybook | URL (after the first Pages deploy) |
| --- | --- |
| React | https://sebastiendegodez.github.io/microcks-deep-ink/react/ |
| Angular | https://sebastiendegodez.github.io/microcks-deep-ink/angular/ |

## Why one set of Web Components

Writing the components twice (React + Angular) means two codebases that drift apart, and plugins that look
different depending on the framework they use. Deep Ink writes each component **once** as a Web Component
(Stencil) and **generates** the React and Angular wrappers.

```
@microcks-deep-ink/tokens        60 CSS variables, dark (Deep Ink) + light (Paper)
          │
@microcks-deep-ink/core          22 Web Components, mk-* tags (Stencil)
          │  generates
   ┌──────┴───────┐
@microcks-deep-ink/react   @microcks-deep-ink/angular   (standalone + ControlValueAccessor)
          │
@microcks-deep-ink/plugin-sdk    manifest, extension points, shared plugin host
```

## Packages

| Package | What it is |
| --- | --- |
| `@microcks-deep-ink/tokens` | `deep-ink.css` (CSS custom properties, both themes), `tokens.json`, typed JS export |
| `@microcks-deep-ink/core` | Web Components, usable without any framework |
| `@microcks-deep-ink/react` | React 18/19 wrappers (`MkButton`, `MkApiBadge`…) |
| `@microcks-deep-ink/angular` | Angular standalone components, `DEEP_INK` import array, forms support for `mk-input` |
| `@microcks-deep-ink/plugin-sdk` | Plugin manifest types + JSON Schema, extension points, `getPluginHost()` |

## Components

| Group | Components |
| --- | --- |
| Signature | `mk-api-badge`, `mk-method-tag` |
| Actions | `mk-button`, `mk-input`, `mk-tabs`, `mk-chip` |
| Feedback | `mk-status-badge`, `mk-live-indicator` |
| Contract | `mk-mock-url`, `mk-operation-row`, `mk-ai-ghost-row`, `mk-drop-zone` |
| Proof | `mk-conformance-band`, `mk-data-table` |
| Navigation | `mk-command-bar` (⌘K) |
| Workflows | `mk-workflow-loom` (Arazzo) |
| Shell | `mk-app-shell`, `mk-top-bar`, `mk-side-nav`, `mk-theme-toggle`, `mk-panel`, `mk-icon` |
| Plugins | `mk-plugin-slot` |

## Use it

The snippets below show the intended API. The packages are not on npm yet: build them locally (`pnpm build`) and consume them from this workspace.

**React**

```tsx
import '@microcks-deep-ink/tokens/deep-ink.css';
import { MkApiBadge, MkButton } from '@microcks-deep-ink/react';

<MkApiBadge protocol="REST" name="API Pastry" version="2.0" />
<MkButton variant="primary" onMkClick={run}>Run test</MkButton>
```

**Angular**

```ts
// angular.json → "styles": ["node_modules/@microcks-deep-ink/tokens/dist/deep-ink.css"]
import { DEEP_INK } from '@microcks-deep-ink/angular';

@Component({
  imports: [DEEP_INK],
  template: `<mk-button variant="primary" (mkClick)="run()">Run test</mk-button>`,
})
```

**Plain HTML / any framework**

```html
<link rel="stylesheet" href="packages/tokens/dist/deep-ink.css" />
<script type="module" src="packages/core/dist/deep-ink/deep-ink.esm.js"></script>
<mk-api-badge protocol="EVENT" name="Pastry orders" version="0.1.0"></mk-api-badge>
```

Theme: dark by default; `document.documentElement.dataset.theme = 'light'` (or `setTheme('light')`) switches to Paper.

## Plugins

See [docs/plugins.md](docs/plugins.md): manifest, backend and frontend parts, extension points, and how a plugin
written in React, Angular or plain JS renders inside the Microcks shell.

## Develop

```bash
pnpm install
pnpm build                 # tokens → plugin-sdk → core (+ generated wrappers) → react → angular
pnpm storybook:react       # http://localhost:6006
pnpm storybook:angular     # http://localhost:6007
pnpm build:storybooks
```

Requirements: Node 22+, pnpm 10.

## Source

Design source: the *Microcks Deep Ink* design system (tokens, principles, component specs) prepared for the
Microcks v2 UI proposal. Design rules live in [docs/design-principles.md](docs/design-principles.md).

## License

Apache License 2.0, the same license as Microcks (see [LICENSE](LICENSE)).

`Microcks` and its logo are trademarks of the Microcks project (CNCF); this design system is a proposal and does not grant any right to use them.
