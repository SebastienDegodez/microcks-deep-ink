/**
 * Clean-architecture dependency rule of the demo (plan section 3.6). Run: `pnpm lint:arch`.
 *
 *   domain          <- application (ports, use cases) <- ui (pages, hooks)
 *   infrastructure  --implements ports of--> application
 *   composition-root.ts / main.tsx          the only places that wire infrastructure to the rest
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

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-isolated',
      comment: 'src/domain imports nothing outside src/domain: no npm package, no React, no other layer.',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { pathNot: ['^src/domain/', TEST_RUNNER] },
    },
    {
      name: 'application-depends-on-domain-only',
      comment: 'src/application imports only src/domain and src/application.',
      severity: 'error',
      from: { path: '^src/application/' },
      to: { pathNot: ['^src/(domain|application)/', TEST_RUNNER] },
    },
    {
      name: 'infrastructure-implements-ports',
      comment: 'src/infrastructure imports src/domain and src/application (ports) only. Never src/ui.',
      severity: 'error',
      from: { path: '^src/infrastructure/' },
      to: { pathNot: ['^src/(domain|application|infrastructure)/', TEST_RUNNER] },
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
      name: 'ui-allowed-imports',
      comment: 'src/ui may only import src/ui, src/application, src/domain, the React packages and @microcks/deep-ink.',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { pathNot: ['^src/(ui|application|domain)/', UI_PACKAGES, DESIGN_SYSTEM, TEST_RUNNER] },
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
      comment: 'vitest and Testing Library may only be imported by *.test.ts(x) files and the test setup.',
      severity: 'error',
      from: { pathNot: ['\\.test\\.tsx?$', '^src/test-setup\\.ts$'] },
      to: { path: TEST_RUNNER },
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
    doNotFollow: { path: ['node_modules', DESIGN_SYSTEM] },
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
