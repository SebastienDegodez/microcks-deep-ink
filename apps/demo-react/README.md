# Microcks UI v2 · DEMO (React)

A clickable, in-memory demo of the 17 screens of the Microcks UI v2 proposal. **Nothing is saved**: every
page shows the DEMO banner. It exists to prove two things:

1. The Deep Ink design system works as **copied code** (shadcn style): the demo imports no
   `@microcks-deep-ink/*` package. Components and styles are copied in by the CLI.
2. The screens fit a **clean architecture** whose dependency rule is enforced by a linter.

It is served under `/demo/` (hash router, Vite `base: './'`) and targets RGAA 4.1.2 / WCAG 2.1 AA
(status: "non audité", never "conforme").

## Run it

```bash
pnpm --filter demo-react dev          # http://localhost:5173/#/
pnpm --filter demo-react test         # Vitest (domain, use cases over the in-memory adapters, routes, a11y shell)
pnpm --filter demo-react lint         # ESLint: typescript-eslint, jsx-a11y strict, react-hooks
pnpm --filter demo-react lint:arch    # dependency-cruiser: the dependency rule below
pnpm --filter demo-react build        # tsc --noEmit, then vite build
```

Useful URLs: `#/map` (screen map with a link to every screen), `#/workflows/pastry/restock-pastry`,
`#/workflows/runs/6729a1d27e4c0b5f93a8c214` (run #14), `#/tests/runner/119`.

`?fast` in the hash query (`#/workflows?fast`) or `localStorage['deep-ink-demo-fast'] = '1'` removes the
simulated latency (120 to 350 ms, deterministic). The Playwright smoke run uses it. Streams tick every 1200 ms.

## Layers

```
 domain  <──  application (ports, use cases)  <──  ui (pages, hooks)
                   ▲
 infrastructure/in-memory ── implements the ports
 composition-root.ts ── the only place that wires infrastructure to the application layer (with main.tsx)
```

| Folder | Contains | May import |
|---|---|---|
| `src/domain/<feature>` | Types and **pure functions**: `conformanceScore`, `formatRelative`, `validatePocSubset`, `executionLayers`, `evaluateCriterion`, `nextAfterStep`, `playWorkflow`, `baggage`, `validateRunRequest`... | `src/domain` only (no npm package, no React). `domain/<a>` never imports `domain/<b>`, except `domain/shared`. |
| `src/application/ports/<feature>.ts` | Interfaces the application needs (`ServiceCatalog`, `WorkflowRunRepository`, `TraceStream`...) | domain |
| `src/application/<feature>/index.ts` | `<Feature>UseCases` interface and `create<Feature>UseCases(ports)`; DTOs of the views | domain, application (ports, shared). Never another feature's folder. |
| `src/application/use-cases.ts` | `UseCases`: the one object pages receive | application |
| `src/infrastructure/in-memory/<feature>` | `createInMemory<Feature>Adapters()`: seeded adapters that implement the ports | domain, application |
| `src/infrastructure/in-memory/shared` | `FixedClock` (2026-11-03T09:10:04Z), `latency()`, `createStream`/`createTickingStream`/`createSequenceStream`, **seeds** (services, Arazzo documents, workflows, runs, sessions), `seed-ids.ts` | domain, application |
| `src/ui/app` | Providers and hooks (`useUseCases`, `useQuery`, `useSubscription`, `usePageTitle`, `useAnnounce`), `PageHeader`, `DemoBanner`, `AppLayout`, `routes.ts`, `router.tsx` | application (types), domain, ui, `react`, `react-router` |
| `src/ui/pages/<screen>/<Name>Page.tsx` | One lazy page per route | same as `ui` |
| `src/ui/components/ui`, `src/ui/styles` | **CLI output**: do not edit by hand (see below) | |

### The dependency rule

Enforced by `.dependency-cruiser.cjs` (every rule has severity `error`, `pnpm lint:arch` must report 0):

- `src/domain/**` imports nothing outside `src/domain`.
- `src/application/**` imports only `src/domain` and `src/application`.
- `src/infrastructure/**` imports `src/domain` and `src/application`, never `src/ui`.
- `src/ui/**` imports `src/application` (types, `UseCases`), `src/domain` (types, pure functions), `src/ui`, `react`, `react-dom` and
  `react-router`. Never `src/infrastructure`.
- Only `src/main.tsx` and `src/composition-root.ts` import `src/infrastructure`.
- No module imports `@microcks-deep-ink/*`.
- No circular dependency (dynamic imports count), no `domain/<a>` to `domain/<b>` (except `shared`), no `application/<a>` to `application/<b>`.
- `vitest` and Testing Library only appear in `*.test.ts(x)` files.

Tests follow the same rules. Write use-case tests that need the in-memory adapters next to the adapters
(`src/infrastructure/in-memory/<feature>/*.test.ts`) or in `src/composition-root.test.ts`. Tests that render the router
live at `src/` level (`app.routes.test.tsx`).

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

## The copied components

`src/ui/components/ui` (components) and `src/ui/styles` (tokens, base and component CSS) are produced by the Deep Ink CLI from
`packages/registry`. They are yours once copied, but in this repo they are regenerated, so fix them in the registry:

```bash
pnpm build
pnpm deep-ink init --cwd apps/demo-react --framework react --out src/ui/components/ui --css-out src/ui/styles --yes
pnpm deep-ink add --all --tier natural,microcks --cwd apps/demo-react
```

`src/main.tsx` picks up `src/ui/styles/index.css` automatically as soon as it exists (`import.meta.glob`). Until the components are
copied, `AppLayout` and the placeholders use raw markup with the `` CSS classes of the registry contract.

## Data

Realistic data comes from the clickable prototypes and the Arazzo POC of the Microcks maintainer: arazzo 1.1.0, actions are `retry` and
`end` only (no goto), `check-menu` uses step-level `dependsOn`, `order-pastry` has AsyncAPI steps and cannot run yet, `beerCatalog` is not
linked. Run #14 of `restock-pastry` targets the implementations (staging) with schema validation on: `patchPastry` fails because `price` comes
back as the string `"3.9"` while its success criteria hold, it is retried twice, the run stops, `verifyPastry` is not run. It is the same bug as
test run #119. Run targets Mocks / Implementations / Mixed (Mixed is proposed, beyond the POC); run origins UI/API, Mock URL, session
(`x-microcks-session`).
