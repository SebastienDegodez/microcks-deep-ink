import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

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
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@microcks-deep-ink/*'], message: 'Import the design system from @microcks/deep-ink (or @/ui/components/ui/<item>), never the workspace packages.' }] },
      ],
    },
  },
  {
    // Accessibility: strict jsx-a11y on every React file (RGAA 4.1.2 / WCAG 2.1 AA, plan section 3.5).
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.strict,
  },
);
