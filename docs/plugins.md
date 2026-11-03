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

The shell loads it and renders contributions where it placed slots:

```ts
import { getPluginHost } from '@microcks-deep-ink/plugin-sdk';
await getPluginHost().load('/plugins/io.github.acme.kafka-replay/kafka-replay.js');
```

```html
<mk-plugin-slot point="service.tabs" .context=${{ theme, service }}></mk-plugin-slot>
```

Each contributed element receives a `context` property (`theme`, `service`, `operation`, `testResult`).
Elements use the Deep Ink CSS variables, so they follow the theme with no extra work, and can use any `mk-*`
component already defined by the shell.

### Rules the host enforces

- A contributed tag must start with the plugin's `tagPrefix` (no collisions between plugins).
- One shared host on `globalThis`, so the shell and every plugin bundle see the same registry even when each
  ships its own copy of the SDK.
- Plugin events are namespaced: `api.emit('replayed')` dispatches `io.github.acme.kafka-replay:replayed`.
- Plugin nav items are grouped under **Plugins** in `mk-side-nav`, so users know where a screen comes from.

## Open questions for the maintainers

These are decisions, not implementation details. They belong in a Microcks discussion before any server work.

1. **Isolation.** Same-origin custom elements are simple but fully trusted. Untrusted marketplace plugins would
   need iframes or a review process. Which trust model for v2?
2. **Backend runtime.** Sidecar container per plugin, or in-process (Quarkus extension, classloader)? The
   manifest's `backend.artifact` stays neutral on purpose.
3. **Distribution.** OCI registry (one artifact holding both parts) or npm for the frontend + OCI for the backend?
4. **Versioning.** The `microcks` SemVer range is checked at install time; extension point names are versioned by
   `schemaVersion`. Is that enough, or do extension points need their own versions?
5. **Shared dependencies.** Plugins may bundle their own framework. Do we accept the weight, or expose an import
   map with shared Angular/React versions?
