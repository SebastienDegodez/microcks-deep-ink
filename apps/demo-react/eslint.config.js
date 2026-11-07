import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

const DESIGN_SYSTEM_PACKAGES = {
  group: ['@microcks-deep-ink/*'],
  message: 'Import the design system from @microcks/deep-ink, never the workspace packages.',
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Architecture rule, second line of defence next to `pnpm lint:arch`.
      'no-restricted-imports': ['error', { patterns: [DESIGN_SYSTEM_PACKAGES] }],
    },
  },
  {
    // Same rule as `ui-does-not-know-http-or-msw` in .dependency-cruiser.cjs: pages only see the UseCases.
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            DESIGN_SYSTEM_PACKAGES,
            {
              group: ['@/infrastructure/http', '@/infrastructure/http/*', '@/infrastructure/msw', '@/infrastructure/msw/*', 'msw', 'msw/*'],
              message: 'src/ui never imports the HTTP adapters, the HttpClient or MSW: go through useUseCases().',
            },
          ],
        },
      ],
    },
  },
  {
    // Accessibility: strict jsx-a11y on every React file (RGAA 4.1.2 / WCAG 2.1 AA, plan section 3.5).
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.strict,
  },
);
