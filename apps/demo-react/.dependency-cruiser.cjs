/**
 * Clean-architecture dependency rule of the demo (plan section 3.6). Run: `pnpm lint:arch`.
 *
 *   domain          <- application (ports, use cases) <- ui (pages, hooks)
 *   infrastructure  --implements ports of--> application
 *   composition-root.ts / main.tsx          the only places that wire infrastructure to the rest
 *   infrastructure/http   adapters calling /api/... with fetch; infrastructure/msw   the mock API (MSW), main.tsx and tests only
 *   domain, application, infrastructure/in-memory   one-line facades over @microcks/demo-core, which holds their code (#287)
 *   ui: the framework-neutral helpers (formatting, navigation, screen map, view models) are one-line facades over
 *       the presentation layer of @microcks/demo-core, which the Svelte demo renders with too
 *
 * Every rule has severity "error". Test files follow the same rules as the code they test: write
 * use-case tests that need the in-memory adapters next to the adapters
 * (`src/infrastructure/in-memory/<feature>/*.test.ts`) or in `src/composition-root.test.ts`.
 */

// tsconfig maps react and react-dom to their @types packages, hence the optional `@types/`.
const UI_PACKAGES = '(^|/)node_modules/(@types/)?(react|react-dom|react-router|scheduler)(/|$)';
// The design system: the @microcks/deep-ink package, a `link:` to the React workspace (resolved to its dist).
const DESIGN_SYSTEM = '(^|/)(node_modules/@microcks/deep-ink|react/packages/deep-ink)/';
// The test runner and Testing Library are allowed anywhere; `test-runner-only-in-tests` keeps it out of production code.
const TEST_RUNNER = '(^|/)node_modules/(vitest|@testing-library/[^/]+)(/|$)';
// Mock Service Worker: the mock API of the `http` backend.
const MSW = '(^|/)node_modules/msw(/|$)';
const TEST_FILE = '\\.test\\.tsx?$';
// The framework-neutral domain, use cases and in-memory adapters (#287): @microcks/demo-core, resolved to its dist.
// src/domain, src/application and src/infrastructure/in-memory keep one-line facades that re-export it.
const DEMO_CORE = '(^|/)(node_modules/@microcks/demo-core|packages/demo-core)/dist/';
const DEMO_CORE_DOMAIN = `${DEMO_CORE}domain/`;
const DEMO_CORE_APPLICATION = `${DEMO_CORE}(domain|application)/`;
const DEMO_CORE_PRESENTATION = `${DEMO_CORE}presentation/`;
// The src/ui modules that re-export a presentation helper of demo-core; the pages keep importing them.
const PRESENTATION_FACADES =
  '^src/ui/(app/(format|nav|outcomes)|lib/cn|pages/(admin/notify|agent/(card|page|run|skills|tasks)|behavior/(config|dispatcher|simulator)|catalogue/listing|cockpit/(attention|overview)|copilot/(generation|proposal)|import/(result|source)|map/screens|service/overview|sources/listing|test-create/(draft|form)|test-run/run|tests/(history|timeline)|usage/(conformance|figures)|workflow/(loom-model|run-facts)))\\.ts$';
// Port contract suites (`*.contract.ts`): test-only modules that tests import, so they follow the test-file exceptions.
const CONTRACT_FILE = '\\.contract\\.ts$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-isolated',
      comment: 'src/domain imports nothing outside src/domain, except the domain layer of demo-core.',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { pathNot: ['^src/domain/', TEST_RUNNER, DEMO_CORE_DOMAIN] },
    },
    {
      name: 'demo-core-only-through-facades',
      comment:
        'Only the facades of src/domain, src/application and src/infrastructure/in-memory, their tests and the test setup import demo-core; the rest of the demo keeps its @/ imports.',
      severity: 'error',
      from: { pathNot: ['^src/(domain|application|infrastructure/in-memory)/', '^src/test-setup\\.ts$', PRESENTATION_FACADES] },
      to: { path: DEMO_CORE },
    },
    {
      name: 'presentation-facades-read-presentation-only',
      comment: 'The src/ui facades re-export the presentation layer of demo-core, never its domain, use cases or adapters.',
      severity: 'error',
      from: { path: PRESENTATION_FACADES },
      to: { path: DEMO_CORE, pathNot: DEMO_CORE_PRESENTATION },
    },
    {
      name: 'application-depends-on-domain-only',
      comment: 'src/application imports only src/domain and src/application, here or in demo-core.',
      severity: 'error',
      from: { path: '^src/application/' },
      to: { pathNot: ['^src/(domain|application)/', TEST_RUNNER, DEMO_CORE_APPLICATION] },
    },
    {
      name: 'infrastructure-implements-ports',
      comment:
        'src/infrastructure imports src/domain and src/application (ports) only, here or in demo-core (plus msw, see msw-only-in-infrastructure-msw). Never src/ui.',
      severity: 'error',
      from: { path: '^src/infrastructure/' },
      to: { pathNot: ['^src/(domain|application|infrastructure)/', TEST_RUNNER, MSW, DEMO_CORE] },
    },
    {
      name: 'msw-only-in-infrastructure-msw',
      comment: 'The msw package is imported by src/infrastructure/msw and by tests only, never by adapters, ui or the composition root.',
      severity: 'error',
      from: { pathNot: ['^src/infrastructure/msw/', TEST_FILE, CONTRACT_FILE] },
      to: { path: MSW },
    },
    {
      name: 'infrastructure-msw-only-from-main-and-tests',
      comment:
        'src/infrastructure/msw (the mock API) is started by src/main.tsx and used by tests only. Adapters and the composition root never know the API is mocked.',
      severity: 'error',
      from: { pathNot: ['^src/main\\.tsx$', '^src/infrastructure/msw/', TEST_FILE, CONTRACT_FILE] },
      to: { path: '^src/infrastructure/msw/' },
    },
    {
      name: 'msw-node-only-in-tests',
      comment: 'src/infrastructure/msw/node.ts (msw/node) is for vitest: only test files import it, so it never reaches the browser bundle.',
      severity: 'error',
      from: { pathNot: [TEST_FILE, CONTRACT_FILE] },
      to: { path: '^src/infrastructure/msw/node\\.ts$' },
    },
    {
      name: 'ui-does-not-know-infrastructure',
      comment:
        'src/ui imports src/application (types and the UseCases interface), src/domain (types and pure functions), src/ui, react, react-dom and react-router. Never src/infrastructure.',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'ui-does-not-know-http-or-msw',
      comment: 'src/ui never imports the HTTP adapters, the HttpClient or the mock API: pages only see the UseCases.',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { path: ['^src/infrastructure/(http|msw)/', MSW] },
    },
    {
      name: 'ui-allowed-imports',
      comment:
        'src/ui may only import src/ui, src/application, src/domain, the React packages and @microcks/deep-ink (and its facades the presentation of demo-core).',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { pathNot: ['^src/(ui|application|domain)/', UI_PACKAGES, DESIGN_SYSTEM, TEST_RUNNER, DEMO_CORE_PRESENTATION] },
    },
    {
      name: 'only-composition-root-imports-infrastructure',
      comment: 'Only src/main.tsx and src/composition-root.ts may import src/infrastructure (plus the infrastructure itself).',
      severity: 'error',
      from: { pathNot: '^src/(main\\.tsx|composition-root\\.ts|infrastructure/)' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'test-runner-only-in-tests',
      comment: 'vitest and Testing Library may only be imported by *.test.ts(x) files, port contract suites (*.contract.ts) and the test setup.',
      severity: 'error',
      from: { pathNot: [TEST_FILE, CONTRACT_FILE, '^src/test-setup\\.ts$'] },
      to: { path: TEST_RUNNER },
    },
    {
      name: 'contracts-only-in-tests',
      comment: 'Port contract suites (*.contract.ts) are imported by tests and other contract suites only, never by production code.',
      severity: 'error',
      from: { pathNot: [TEST_FILE, CONTRACT_FILE] },
      to: { path: CONTRACT_FILE },
    },
    {
      name: 'no-design-system-packages',
      comment:
        'No module imports the @microcks-deep-ink/* workspace packages. The design system is @microcks/deep-ink (imported as @/ui/components/ui/<item> or directly).',
      severity: 'error',
      from: {},
      to: { path: '@microcks-deep-ink' },
    },
    {
      name: 'no-cross-feature-domain',
      comment: 'src/domain/<a> must not import src/domain/<b>, except src/domain/shared.',
      severity: 'error',
      from: { path: '^src/domain/([^/]+)/' },
      to: { path: '^src/domain/([^/]+)/', pathNot: ['^src/domain/$1/', '^src/domain/shared/'] },
    },
    {
      name: 'no-cross-feature-demo-core-domain',
      comment: 'src/domain/<a> must not import the domain of feature <b> from demo-core either, except its shared domain.',
      severity: 'error',
      from: { path: '^src/domain/([^/]+)/' },
      to: { path: `${DEMO_CORE}domain/([^/]+)/`, pathNot: [`${DEMO_CORE}domain/$1/`, `${DEMO_CORE}domain/shared/`] },
    },
    {
      name: 'no-cross-feature-application',
      comment:
        'src/application/<a> must not import src/application/<b>; cross-feature reads go through src/application/ports and src/application/shared.',
      severity: 'error',
      from: { path: '^src/application/(arazzo|catalog|copilot|govern|importing|observe|testing)/' },
      to: {
        path: '^src/application/(arazzo|catalog|copilot|govern|importing|observe|testing)/',
        pathNot: ['^src/application/$1/'],
      },
    },
    {
      name: 'no-cross-feature-demo-core-application',
      comment: 'src/application/<a> must not import the use cases of feature <b> from demo-core either.',
      severity: 'error',
      from: { path: '^src/application/(arazzo|catalog|copilot|govern|importing|observe|testing)/' },
      to: {
        path: `${DEMO_CORE}application/(arazzo|catalog|copilot|govern|importing|observe|testing)/`,
        pathNot: [`${DEMO_CORE}application/$1/`],
      },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependency, including across features (dynamic imports count).',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-unresolvable',
      comment: 'Every import must resolve (this also catches typos in the @/ alias).',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    // demo-core checks its own layers (packages/demo-core/test/layers.test.mjs).
    doNotFollow: { path: ['node_modules', DESIGN_SYSTEM, DEMO_CORE] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    exclude: { path: '\\.(css|svg)$' },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
