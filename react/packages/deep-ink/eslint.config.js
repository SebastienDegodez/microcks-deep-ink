// Flat config: jsx-a11y (strict) and react-hooks on the React sources (moved from packages/registry).
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'src/elements/**'] },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...tseslint.configs.recommended.reduce((acc, c) => ({ ...acc, ...(c.rules ?? {}) }), {}),
    },
  },
  {
    ...jsxA11y.flatConfigs.strict,
    files: ['src/**/*.tsx'],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // Scrollable regions and tab panels are focusable by design (WAI-ARIA tabs, WCAG 2.1.1 for scrolling).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'], tags: [] }],
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ['src/**/*.{ts,tsx}'],
  },
];
