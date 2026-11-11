# Microcks UI v2 · DEMO (React)

A clickable, in-memory demo of the 19 screens of the Microcks UI v2 proposal. **Nothing is saved**: every
page shows the DEMO banner. It exists to prove two things:

1. The Deep Ink design system works as **copied code** (shadcn style): the demo imports no
   `@microcks-deep-ink/*` package. Components and styles are copied in by the CLI.
2. The screens fit a **clean architecture** whose dependency rule is enforced by a linter.

It is served under `/demo/` (hash router, Vite `base: './'`) and targets RGAA 4.1.2 / WCAG 2.1 AA
(status: "non audité", never "conforme").

## Run it

```bash
pnpm --filter @microcks/demo-core build # build the framework-neutral demo core first (domain, use cases, in-memory adapters)
pnpm --filter demo-react dev          # http://localhost:5173/#/
pnpm --filter demo-react test         # Vitest (domain, use cases over the in-memory adapters, routes, a11y shell)
pnpm --filter demo-react lint         # ESLint: typescript-eslint, jsx-a11y strict, react-hooks
pnpm --filter demo-react lint:arch    # dependency-cruiser: the dependency rule below
pnpm --filter demo-react build        # tsc --noEmit, then vite build
```

Useful URLs: `#/map` (screen map with a link to every screen), `#/workflows/pastry/restock-pastry`,
`#/workflows/runs/6729a1d27e4c0b5f93a8c214` (run #14), `#/tests/runner/119`, `#/services/concierge/skills` (the A2A agent, screen 18),
`#/tests/agent/3` (its conformance test, screen 19) and `#/sources/new` (add a source).

`?fast` in the hash query (`#/workflows?fast`) or `localStorage['deep-ink-demo-fast'] = '1'` removes the
simulated latency (120 to 350 ms, deterministic). The Playwright smoke run uses it, and `src/test-setup.ts` removes it for
Vitest with `setDefaultLatencyMode('fast')`. Streams tick every 1200 ms.

## Backends

`createComposition({ backend })` in `src/composition-root.ts` picks the adapters; `main.tsx` reads `VITE_DEMO_BACKEND`.

- `memory` (default): the in-memory adapters, no network.
- `http` (`VITE_DEMO_BACKEND=http pnpm --filter demo-react dev`): features with adapters in `src/infrastructure/http/<feature>`
  call `api/...` (next to `index.html`) through `HttpClient` (`src/infrastructure/http/client.ts`, errors mapped to
  `NotFoundError`, `ValidationError`, `BackendError`). Mock Service Worker answers them: `src/infrastructure/msw/handlers/<feature>.ts`,
  served by `browser.ts` (the worker `public/mockServiceWorker.js`, registered with a relative URL so its scope is the demo's
  folder, quiet; an unhandled `/api/` request logs a console error, everything else bypasses it) and by `node.ts` in vitest.
  The first render waits for `worker.start()`. A feature without HTTP adapters falls back to memory (`httpFeatures` lists
  the others). The `memory` build does not contain MSW.
- `testing` over HTTP: the Microcks test API v1.15 (`/api/tests...`, endpoints and demo-only extensions listed in
  `src/infrastructure/http/testing/microcks.ts`). A live run (`watch`) fetches the run once and replays its steps client-side,
  one per tick: Microcks has no test-progress stream (its UI polls `GET /api/tests/{id}`).

### Port contract tests

Each feature has ONE contract suite, `src/application/ports/__contracts__/<feature>.contract.ts`
(`describe<Feature>PortContract(name, makeAdapters)`): the observable behaviour of its ports, through their interface only
(seed results, ordering, filters, not-found, mutations visible on re-read, stream subscribe/unsubscribe under fake timers).
Stream checks are timing-agnostic (`takeEmissions`/`nextEmission` await emissions and assert their order and content, never that
they arrive synchronously); `src/infrastructure/in-memory/async-streams.contract.test.ts` reruns the suites with asynchronous delivery.
The in-memory adapters are the reference and pass it in `src/infrastructure/in-memory/<feature>/<feature>.contract.test.ts`.

The same suites run over HTTP + MSW (`msw/node`) in `src/infrastructure/http/port-contracts.test.ts`, through
`describePortContractOverHttp` (`src/infrastructure/msw/http.contract.ts`). A feature without HTTP adapters is reported as `todo`.
To plug a feature in: add `createHttp<Feature>Adapters({ http, clock })` in `src/infrastructure/http/<feature>` and its handlers in
`src/infrastructure/msw/handlers/<feature>.ts`, then set `http: createHttp<Feature>Adapters` on the feature's row (plus
`handlers: () => [...]` when the handlers keep a seeded state, so each test starts from the seed). `*.contract.ts` files are
test-only: `lint:arch` lets them import vitest and MSW, and only tests may import them.

## Layers

```
 domain  <──  application (ports, use cases)  <──  ui (pages, hooks)
                   ▲
 infrastructure/in-memory, infrastructure/http ── implement the ports   (infrastructure/msw: the mock API)
 composition-root.ts ── the only place that wires infrastructure to the application layer (with main.tsx)
```

The code of `src/domain`, `src/application` (except the port contract suites) and `src/infrastructure/in-memory` lives in the
framework-neutral [`@microcks/demo-core`](../../packages/demo-core/README.md) package (#287), so the Svelte demo can reuse it. Each
of their modules here is a one-line facade, `export * from '@microcks/demo-core/<same path>'`, so the rest of the demo keeps
its `@/` imports. Their tests stay here.

| Folder | Contains | May import |
|---|---|---|
| `src/domain/<feature>` | Types and **pure functions**: `conformanceScore`, `formatRelative`, `validatePocSubset`, `executionLayers`, `evaluateCriterion`, `nextAfterStep`, `playWorkflow`, `baggage`, `validateRunRequest`... | `src/domain` and the demo-core domain only (no React). `domain/<a>` never imports `domain/<b>`, except `domain/shared`. |
| `src/application/ports/<feature>.ts` | Interfaces the application needs (`ServiceCatalog`, `WorkflowRunRepository`, `TraceStream`...) | domain |
| `src/application/<feature>/index.ts` | `<Feature>UseCases` interface and `create<Feature>UseCases(ports)`; DTOs of the views | domain, application (ports, shared). Never another feature's folder. |
| `src/application/use-cases.ts` | `UseCases`: the one object pages receive | application |
| `src/infrastructure/in-memory/<feature>` | `createInMemory<Feature>Adapters()`: seeded adapters that implement the ports | domain, application |
| `src/infrastructure/in-memory/shared` | `FixedClock` (2026-11-03T09:10:04Z), `latency()`, `setDefaultLatencyMode()`, `createStream`/`createTickingStream`/`createSequenceStream`, **seeds** (services, Arazzo documents, workflows, runs, sessions), `seed-ids.ts` | domain, application |
| `src/ui/app` | Providers and hooks (`useUseCases`, `useQuery`, `useSubscription`, `usePageTitle`, `useAnnounce`), `PageHeader`, `DemoBanner`, `AppLayout`, `routes.ts`, `router.tsx` | application (types), domain, ui, `react`, `react-router` |
| `src/ui/pages/<screen>/<Name>Page.tsx` | One lazy page per route | same as `ui` |
| `@microcks/deep-ink` | The design system package (see below) | |

### The dependency rule

Enforced by `.dependency-cruiser.cjs` (every rule has severity `error`, `pnpm lint:arch` must report 0):

- `src/domain/**` imports nothing outside `src/domain`, except the domain of `@microcks/demo-core` that its facades re-export.
- Only `src/domain`, `src/application`, `src/infrastructure/in-memory` (facades, tests, port contracts) and `src/test-setup.ts`
  import `@microcks/demo-core`. The package checks its own layers (`packages/demo-core/test/layers.test.mjs`).
- `src/application/**` imports only `src/domain` and `src/application`, here or in demo-core.
- `src/infrastructure/**` imports `src/domain` and `src/application`, here or in demo-core, never `src/ui`.
- `src/ui/**` imports `src/application` (types, `UseCases`), `src/domain` (types, pure functions), `src/ui`, `react`, `react-dom` and
  `react-router`. Never `src/infrastructure`.
- Only `src/main.tsx` and `src/composition-root.ts` import `src/infrastructure`.
- `src/ui/**` never imports `src/infrastructure/http`, `src/infrastructure/msw` or `msw` (also an ESLint rule). `msw` is imported by
  `src/infrastructure/msw` and tests only; `src/infrastructure/msw` by `src/main.tsx` and tests only; `msw/node.ts` by tests only.
- No module imports `@microcks-deep-ink/*`.
- No circular dependency (dynamic imports count), no `domain/<a>` to `domain/<b>` (except `shared`), no `application/<a>` to
  `application/<b>`, here or in demo-core.
- `vitest` and Testing Library only appear in `*.test.ts(x)` files and the port contract suites (`*.contract.ts`), which only tests import.

Tests follow the same rules. Write use-case tests that need the in-memory adapters next to the adapters
(`src/infrastructure/in-memory/<feature>/*.test.ts`) or in `src/composition-root.test.ts`. Tests that render the router
live at `src/` level (`app.routes.test.tsx`).

## The A2A agent (screens 18 and 19)

An agent imported from its Agent Card is a service whose protocol is `A2A` (token `proto-a2a`). It follows spec 1.0: three
protocol bindings (JSON-RPC 2.0, HTTP+JSON, gRPC), task states `submitted`, `working`, `input-required` and `auth-required`
(interrupted) then the terminal `completed`, `failed`, `rejected` and `canceled`, and the `TASK_STATE_*` wire names in raw payloads.
Skills are counted as operations ("skills" in the UI).

- `src/domain/agents`: Agent Card, skills, scripted conversations, tasks, mock call samples, the test plan and its totals (pure).
- `src/application/agents` and `ports/agents.ts`: `AgentRepository`, `AgentTaskGateway` (1 s stream, `CancelTask`), `AgentTestGateway`.
- `src/infrastructure/in-memory/agents`: the Pastry concierge (3 skills, 4 conversations plus the fallback), its tasks (`task-9a04` streams) and
  the conformance runner (run #3 fails on HTTP+JSON `eclair-size-m` and gRPC `ord-2417-ready`).
- The service route `#/services/:serviceId/:tab?` shows the Agent screen when the protocol is `A2A`; the test is `#/tests/agent/:runId?`.
- New registry items used here: `task-timeline`, `conformance-matrix`, `skill-list`.

## Adding a use case (phase-2 contract)

1. Domain types and pure functions in `src/domain/<feature>`.
2. If a new capability is needed, add a method to the port in `src/application/ports/<feature>.ts`.
3. Add the method to the `<Feature>UseCases` interface and implement it in `create<Feature>UseCases`
   (additive only: do not change another feature's interface).
4. Implement the port in `src/infrastructure/in-memory/<feature>/index.ts`, with `await latency()` through `after(...)`.
5. Use it from a page through `useUseCases()` and `useQuery(() => uc.<feature>.<method>(), [deps])`.

Cross-feature reads go through the ports (`observe` reads the catalogue and the test runs through
`ServiceCatalog` and `TestRunRepository`; the composition root hands them over).

## Page rules (accessibility contract)

Every page: one `<PageHeader title=...>` (the single `<h1>`, focusable), `usePageTitle('<Title> · Microcks')`,
loading state with `aria-busy`, an error state, an empty state where the prototype has one, and Pause on any
moving content (`useSubscription` returns `pause()`/`resume()`).

`usePageTitle` sets a unique `document.title`, announces it in the shell's live region and moves focus to the `<h1>` when the **route**
changes (not on a tab, filter or param change; routes use optional segments such as `:tab?` for that reason). The skip link targets
`<main id="main" tabindex="-1">`. Because the router is a hash router, the skip link's click is intercepted (a plain `#main` href would
navigate).

## The design system

The components and styles come from `@microcks/deep-ink`, the React package of the repo (`react/packages/deep-ink`), linked with
`"@microcks/deep-ink": "link:../../react/packages/deep-ink"`. Build it before the demo:

```bash
pnpm install && pnpm build                                  # root: tokens, elements, registry CSS
pnpm -C react install --frozen-lockfile && pnpm -C react build
pnpm --filter demo-react dev
```

`src/main.tsx` imports `@microcks/deep-ink/styles.css` once. Pages import `@microcks/deep-ink`;
`LoomHost` loads the Loom with a dynamic `import('@microcks/deep-ink/workflow-loom')`, so it stays in its own lazy chunk.
Fix components in the package (`react/packages/deep-ink/src`), never in the demo.

## Data

Realistic data comes from the clickable prototypes and the Arazzo POC of the Microcks maintainer: arazzo 1.1.0, actions are `retry` and
`end` only (no goto), `check-menu` uses step-level `dependsOn`, `order-pastry` has AsyncAPI steps and cannot run yet, `beerCatalog` is not
linked. Run #14 of `restock-pastry` targets the implementations (staging) with schema validation on: `patchPastry` fails because `price` comes
back as the string `"3.9"` while its success criteria hold, it is retried twice, the run stops, `verifyPastry` is not run. It is the same bug as
test run #119. Run targets Mocks / Implementations / Mixed (Mixed is proposed, beyond the POC); run origins UI/API, Mock URL, session
(`x-microcks-session`).
