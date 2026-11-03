// Flat config. React sources get jsx-a11y (strict) and react-hooks.
// Angular sources get the angular-eslint template accessibility rules (inline templates included).
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

export default [
  { ignores: ['dist/**', '.ngc/**', 'src/react/elements/**', 'src/angular/elements/**'] },

  {
    files: ['src/react/**/*.{ts,tsx}'],
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
    files: ['src/react/**/*.tsx'],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // Scrollable regions and tab panels are focusable by design (WAI-ARIA tabs, WCAG 2.1.1 for scrolling).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'], tags: [] }],
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ['src/react/**/*.{ts,tsx}'],
  },

  // Angular: lint the HTML that angular-eslint extracts from inline templates.
  {
    files: ['src/angular/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@angular-eslint/template': angularTemplate },
    processor: angularTemplate.processors['extract-inline-html'],
  },
  {
    files: ['src/angular/**/*.html'],
    languageOptions: { parser: angularTemplateParser },
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/no-autofocus': 'error',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
      '@angular-eslint/template/table-scope': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/button-has-type': 'error',
    },
  },
];
