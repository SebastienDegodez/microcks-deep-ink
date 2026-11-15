// Flat config: typescript-eslint everywhere, eslint-plugin-svelte (with its a11y rules) on the components.
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default [
  { ignores: ['dist/**', 'src/lib/internal/elements/**'] },
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'], svelteConfig } },
  },
  {
    files: ['**/*.svelte'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'SvelteStyleElement', message: 'No <style> in .svelte files: the CSS is the shared registry CSS (packages/registry/src/css).' },
      ],
    },
  },
];
