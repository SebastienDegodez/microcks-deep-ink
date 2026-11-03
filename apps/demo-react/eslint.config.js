import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    // `src/ui/components/ui` and `src/ui/styles` are CLI output (copied from packages/registry, where the
    // same source is linted with the same a11y rules). Edit them in the registry, never here.
    ignores: ['dist/**', 'node_modules/**', 'src/ui/components/ui/**', 'src/ui/styles/**'],
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
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@microcks-deep-ink/*'], message: 'Copy components with the CLI into src/ui/components/ui; never import the packages.' }] },
      ],
    },
  },
  {
    // Accessibility: strict jsx-a11y on every React file (RGAA 4.1.2 / WCAG 2.1 AA, plan section 3.5).
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.strict,
  },
);
