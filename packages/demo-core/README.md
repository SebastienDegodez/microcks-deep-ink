# Demo core (#287)

`@microcks/demo-core` is a private root-workspace package, not a design system. It holds the
framework-neutral half of the Microcks demo: the domain, the use cases with their ports, and the
in-memory adapters with their seed data. React, Svelte and Angular demos are alternative consumers.
Each one keeps its own rendering, routing, hooks, page styles and composition root; no rendering
code is shared.

## Layout and entry points

```text
src/domain/<feature>/                    pure types and functions
src/application/<feature>/               use cases: create<Feature>UseCases(ports)
src/application/ports/                   the ports the use cases depend on
src/infrastructure/in-memory/<feature>/  createInMemory<Feature>Adapters(deps?) and seed data
```

Features: `agents`, `arazzo`, `catalog`, `copilot`, `govern`, `importing`, `observe`, `testing`,
plus `shared`. Every directory with an `index.ts` is an explicit entry point, for example
`@microcks/demo-core/domain/catalog` or `@microcks/demo-core/infrastructure/in-memory/shared`.
Any other module is reachable by its path without extension, for example
`@microcks/demo-core/infrastructure/in-memory/shared/stream`. Exports resolve to the built
JavaScript and declarations in `dist`, not to source aliases.

```ts
import { createCatalogUseCases } from '@microcks/demo-core/application/catalog';
import { createInMemoryCatalogAdapters } from '@microcks/demo-core/infrastructure/in-memory/catalog';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';

const clock = new FixedClock(); // 2026-11-03T09:10:04Z, the instant every demo screen shows
const catalog = createCatalogUseCases(createInMemoryCatalogAdapters({ clock }));
```

`apps/demo-react/src/composition-root.ts` is the reference wiring of every feature, including the
cross-feature ports (testing reads the catalogue and the importing secrets, observe reads the
catalogue and the test runs). A demo that renders the same screens must wire them the same way.

## Host services

demo-core typechecks against ES2022 only, without the DOM or Node types, and reads the host when
called:

- `parseUrl` (`domain/shared`) parses with the host's WHATWG `URL`.
- `infrastructure/in-memory/shared/timers` reads `setTimeout`, `setInterval` and `clearInterval`
  from `globalThis` at every call, so test fake timers apply.
- Every in-memory adapter waits a deterministic simulated latency (120 to 350 ms). The latency is
  removed when `setLatencyMode('fast')` forces it, when `setDefaultLatencyMode('fast')` made fast
  the default (test setups call it once, since demo-core cannot detect a test runner), when the
  page hash query has `fast` (`#/services?fast`) or when
  `localStorage['deep-ink-demo-fast'] === '1'`. `setLatencyMode('normal')` forces the latency back.

Latency and streams keep module state: a demo must load one copy of the package, which the
exports to `dist` guarantee when every import goes through `@microcks/demo-core`.

## Build and verify (repository root)

```sh
pnpm --filter @microcks/demo-core build
pnpm --filter @microcks/demo-core typecheck
pnpm --filter @microcks/demo-core test
pnpm --filter @microcks/demo-core lint:arch
```

The root `pnpm build` includes this package via `packages/*`; root `pnpm build:demo` builds it
before the React demo. The isolated Svelte workspace consumes it with
`link:../../../packages/demo-core` from its app directory and builds it first, without making the
alternative framework workspaces depend on one another.

`test` loads every entry point in plain Node and exercises the host services. `lint:arch` keeps
TypeScript as the only development dependency, rejects runtime dependencies, non-TypeScript
sources, JSX, imports leaving `src` (type-only and dynamic ones included), computed module imports
and reference directives, forbids design-system manifests from depending on demo-core or the demos,
and enforces the layer rules demo-react applied to this code: the domain imports only the domain
and never another feature except `shared`; the application imports only the domain and the
application, and a feature's use cases never import another feature's; no import cycle.

## React facades

demo-react keeps one-line facades (`export * from '@microcks/demo-core/<path>'`) at the old paths
of `src/domain`, `src/application` and `src/infrastructure/in-memory`, so its pages, HTTP adapters,
mock API and composition root keep their `@/` imports. The Vitest suites of the extracted code stay
in demo-react next to those facades and import demo-core directly; `src/test-setup.ts` sets the
default latency mode to `fast`. Its dependency rules let only the facades, their tests and the test
setup import demo-core, with the same layer and cross-feature rules as its own source.
