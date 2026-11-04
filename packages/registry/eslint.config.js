// Flat config. The React sources moved to react/packages/deep-ink (linted there).
// Angular sources get the angular-eslint template accessibility rules (inline templates included).
import tseslint from 'typescript-eslint';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';

export default [
  { ignores: ['dist/**', '.ngc/**', 'src/angular/elements/**'] },

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
