# Plugins: a marketplace for Microcks

A Microcks plugin is **one marketplace entry** that can ship a **backend part**, a **frontend part**, or both.
This repository defines the contract and the frontend runtime. The backend loader belongs to the Microcks server.

```
                 microcks-plugin.json  (validated by microcks-plugin.schema.json)
                ┌───────────────────────────────┐
                │ id · version · microcks range │
                │ permissions · categories      │
                └──────┬─────────────────┬──────┘
                       │                 │
            backend part                 frontend part
     (OCI image / artifact)              (ES module, custom elements)
                       │                 │
   Microcks server extension points      UI v2 shell extension points
   importer · dispatcher ·               nav.items · command.actions ·
   test-runner · secret-provider         cockpit.widgets · service.header.badges ·
                                         service.tabs · operation.panels ·
                                         import.sources · test.results.panels
                       │                 │
                       └──── shared ─────┘
                       REST API + event bus (plugin-id:event)
```

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "io.github.acme.kafka-replay",
  "name": "Kafka Replay",
  "version": "0.3.0",
  "publisher": { "name": "ACME" },
  "microcks": ">=2.0.0 <3.0.0",
  "categories": ["observability"],
  "protocols": ["EVENT"],
  "permissions": ["services:read", "tests:run"],
  "backend": {
    "artifact": "ghcr.io/acme/microcks-kafka-replay:0.3.0",
    "extensions": [{ "point": "test-runner", "id": "kafka-replay", "protocols": ["EVENT"] }]
  },
  "frontend": {
    "entry": "./kafka-replay.js",
    "tagPrefix": "acme-",
    "contributes": ["nav.items", "service.tabs", "cockpit.widgets"]
  }
}
```

Schema: [`packages/plugin-sdk/microcks-plugin.schema.json`](../packages/plugin-sdk/microcks-plugin.schema.json).

A plugin with a `frontend` part must declare `tagPrefix` and `contributes`. The prefix cannot be `mk-`, `microcks-`
or a prefix that would cover a host tag (`workflow-`, `command-`, `plugin-`). The same rules are checked by the schema
(at install time) and by the host (at runtime, `validateManifest()` in the SDK).

## Frontend part

The entry module exports a plugin. Contributions are **custom elements**, so the plugin can be written with any
framework: plain Web Components, Lit, Stencil, Angular Elements, or React with a custom-element adapter.

```ts
import { definePlugin } from '@microcks-deep-ink/plugin-sdk';
import manifest from './microcks-plugin.json';
import './replay-widget'; // defines <acme-replay-widget>

export default definePlugin({
  manifest,
  activate(api) {
    api.contribute('nav.items', { id: 'replay', title: 'Kafka Replay', element: 'acme-replay-widget' });
    api.contribute('service.tabs', {
      id: 'replay-tab',
      title: 'Replay',
      element: 'acme-replay-widget',
      when: (ctx) => ctx.service?.protocol === 'EVENT',
    });
  },
});
```

The shell loads it and renders contributions where it placed slots. The manifest comes from the **server** (it is the
one the admin installed), not from the module, and `integrity` pins the bytes of the entry:

```ts
import { getPluginHost } from '@microcks-deep-ink/plugin-sdk';
await getPluginHost().load('/plugins/io.github.acme.kafka-replay/kafka-replay.js', {
  manifest: manifestFromServer,           // wins over the manifest exported by the module
  integrity: 'sha256-<base64 of the entry>',  // optional; sha384 and sha512 also work
  granted: ['services:read'],             // optional; the manifest may not request more
});
```

The trusted manifest is validated, must match `frontend.entry`, and must be **identical** to the manifest exported by the
module: any difference (a wider `contributes`, another `tagPrefix`, more `permissions`, another `version`) is an error and
nothing is registered. With `integrity`, the host downloads the entry, compares its hash and imports the module from
those verified bytes, so the entry must be a self-contained bundle (no relative imports). Without a `manifest` option the
module's own manifest is validated and used, which suits development and tests only.

`getPluginHost()` defines `globalThis.__MICROCKS_PLUGIN_HOST__` once, as a non-writable, non-configurable property, so no
plugin can replace the host that the shell and the other bundles share. Call it in the shell before loading any plugin.

```html
<plugin-slot point="service.tabs" .context=${{ theme, service }}></plugin-slot>
```

Each contributed element receives a `context` property (`theme`, `service`, `operation`, `testResult`).

`<plugin-slot>` renders contributions in the **light DOM** (no shadow root). The Deep Ink custom properties
(`--action`, `--surface`...) and the CSS classes of the design system (`.button`, `.field`, `.table`...) therefore reach
plugin elements with no extra work, and the plugin follows the theme. The HTML recipes of the registry
(`packages/registry/src/html/<name>.html`) are the reference for the markup of each component; a plugin can copy them
with `pnpm deep-ink add <item> --framework html --markup-only` (markup only, no CSS: see below). The tags `workflow-loom`,
`command-bar` and `plugin-slot`, and every tag that starts with `mk-` (the Angular selector prefix of the shell) or
`microcks-`, belong to the host: plugins use their own `tagPrefix`.

### The CSS rule for plugins

**The host owns all design-system CSS**: tokens, base styles, and the `@layer deep-ink.components` styles of every
component. Component styles of the shell live in that layer, and **unlayered CSS always beats layered CSS**, whatever the
specificity, so a plugin stylesheet that is not scoped would silently override the shell (a plugin rule such as
`button { border-radius: 0 }` or `.button { ... }` would restyle every button of the host). A plugin's own copy of
`@layer deep-ink.components` would merge into the host's layer and override it. The plugin contract is therefore:

1. **Do not copy design-system CSS.** Copy markup only:
   `pnpm deep-ink add button tabs --framework html --markup-only`. This copies the HTML recipes (and the element bundles
   of element items) and never `tokens.css`, `base.css`, a component stylesheet or `index.css`; the mode is remembered in
   `deep-ink.json`, so later `add` calls stay CSS-free.
2. **Scope every selector of the plugin's own stylesheet with the plugin's `tagPrefix`** (for `tagPrefix: "acme-"`:
   `acme-replay-widget .row { ... }`, `acme-replay-widget button { ... }`), or
3. **keep the plugin's styles in shadow DOM** (a `<style>` inside the element's shadow root, or `adoptedStyleSheets`).
   Shadow DOM blocks the design system classes, so such a plugin brings the CSS it needs into its own root.

A plugin must not declare global selectors (`html`, `body`, `:root`, bare element or class selectors), must not use
`@layer deep-ink*`, and must not redefine the design tokens (`--action`, `--surface`...). To change the look of one of
its own components, scope an override under the plugin tag.

#### Checking a plugin stylesheet

`packages/plugin-sdk/scripts/check-plugin-css.mjs` (zero dependencies) enforces this rule. The host can run it at install
time, on every CSS file of the bundle, before it enables the plugin:

```bash
node packages/plugin-sdk/scripts/check-plugin-css.mjs --manifest microcks-plugin.json dist/plugin.css
# or give the tag prefix instead of the manifest: --prefix acme-   (the plugin's custom-element tagPrefix, not a CSS class prefix)
# optional: --tokens path/to/tokens.json|tokens.css   (default: packages/tokens/tokens.json)
```

It prints `file:line: code: message` and exits 1 when it finds a violation:

| Code | Rejected |
|---|---|
| `unscoped-selector` | a selector that does not start with a `tagPrefix*` tag (bare element, class, id, attribute, `*`...) |
| `global-selector` | `:root`, `html`, `body` anywhere in a selector |
| `layer-deep-ink` | `@layer deep-ink*`, `@import ... layer(deep-ink*)` |
| `token-redefined` | a declaration or `@property` of a design token, read from `packages/tokens/tokens.json`, even inside a scoped rule |
| `import` | an `@import`, which hides CSS from the check: bundle it |

The same function is exported for hosts written in JavaScript: `import { checkPluginCss } from '@microcks-deep-ink/plugin-sdk/check-plugin-css'`,
`checkPluginCss(cssText, 'acme-', { tokenNames })` returns `{ ok, violations }`. It reads stylesheets; it does not see
inline `style` attributes or styles injected at runtime, and a plugin that is not subject to review can still do both
(see the trust model).

### What the host enforces, and what is convention

**Enforced by the host** (the plugin cannot opt out; each rule has a test in `packages/plugin-sdk/test`):

- A manifest is validated before anything runs, with the same rules as the schema. A `frontend` part without a
  `tagPrefix`, or with a reserved one (`mk-`, `microcks-`, `workflow-`, `command-`, `plugin-`), is rejected.
- A contributed tag must contain a hyphen (`script`, `iframe`... are refused), must start with the plugin's `tagPrefix`,
  and can never be a host tag (`workflow-loom`, `command-bar`, `plugin-slot`) or start with `mk-` or `microcks-`.
  A plugin without a `frontend` part cannot contribute at all.
- An extension point must be listed in `frontend.contributes`.
- A permission the extension point requires must be in the manifest (`import.sources` needs `services:write`), and with
  `granted` the manifest cannot request more than the admin granted. `api.hasPermission()` tells the plugin what it has.
- With a trusted manifest from the server, the module's own manifest must be identical; with `integrity`, the entry must
  match its hash. The manifest handed to the plugin is a frozen copy.
- One shared host on `globalThis`, defined once and read-only, so the shell and every plugin bundle see the same registry
  even when each ships its own copy of the SDK.
- A plugin that throws while activating is removed again, with its contributions.
- Plugin events are namespaced: `api.emit('replayed')` dispatches `io.github.acme.kafka-replay:replayed`.
- Plugin nav items are grouped under **Plugins** in the application shell's navigation, so users know where a screen comes from.

**Convention only** (nothing stops a plugin from breaking these; review or the install-time checker catches them):

- The CSS rule above. The host can run `check-plugin-css.mjs` at install time; it cannot police styles added at runtime.
- Contribution `id`s are unique within a plugin; `order` and `title` are honest.
- Permissions are consent shown at install time and a gate on the host API, **not a sandbox** (see the trust model).
- Plugin elements only use the `context` they are given and the documented REST API.

### Trust model

In v2, **plugins are installed by an admin and are fully trusted**. A frontend part is same-origin JavaScript: it runs in
the page of the shell, and so it can read the user's token, call the whole REST API as the user, read the DOM and patch
globals. The rules above stop accidents (collisions, a plugin overriding the shell, a tampered bundle, a module claiming
more than the admin approved); they do not stop a malicious plugin, and `permissions` cannot either, because the
browser gives the host no way to hold back what the same origin can already do.

So for now: install only plugins you would also accept as a pull request to the shell, pin them with `integrity`, and
let the server (not the module) supply the manifest. **Untrusted marketplace plugins would need iframe isolation**
(a sandboxed iframe on another origin, talking to the shell through `postMessage` with a narrow API); that changes the
contribution model, because an iframe cannot share the light DOM and the design system CSS. It stays an open question
(see below), and nothing in this repository claims to be a security boundary.

## Open questions for the maintainers

These are decisions, not implementation details. They belong in a Microcks discussion before any server work.

1. **Isolation.** Same-origin custom elements are simple but fully trusted (see the trust model). Untrusted
   marketplace plugins would need iframes or a review process. Is "admin-installed, fully trusted" enough for v2?
2. **Backend runtime.** Sidecar container per plugin, or in-process (Quarkus extension, classloader)? The
   manifest's `backend.artifact` stays neutral on purpose.
3. **Distribution.** OCI registry (one artifact holding both parts) or npm for the frontend + OCI for the backend?
4. **Versioning.** The `microcks` SemVer range is checked at install time; extension point names are versioned by
   `schemaVersion`. Is that enough, or do extension points need their own versions?
5. **Shared dependencies.** Plugins may bundle their own framework. Do we accept the weight, or expose an import
   map with shared Angular/React versions?
