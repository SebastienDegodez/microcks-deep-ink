import assert from 'node:assert/strict';
import { test } from 'node:test';
import { asFramework, importSnippet } from './model.ts';

test('Svelte is accepted without changing React, Angular or HTML selection', () => {
  for (const framework of ['react', 'angular', 'html', 'svelte'] as const) assert.equal(asFramework(framework, 'react'), framework);
  assert.equal(asFramework('unknown', 'angular'), 'angular');
});
test('public Svelte import names are deduplicated and helpers do not replace components', () => {
  assert.equal(importSnippet(['button', 'button', 'theme-toggle'], { button: ['Button', 'ButtonLink', 'buttonClasses'], 'theme-toggle': ['ThemeToggle', 'setTheme'] }), "import '@microcks/deep-ink/styles.css'; // once, in your entry file\nimport { Button, ButtonLink, ThemeToggle } from '@microcks/deep-ink';");
});
test('helper-only modules and multiline imports remain available', () => {
  assert.match(importSnippet(['theme'], { theme: ['setTheme'] }), /import \{ setTheme \}/);
  assert.match(importSnippet(['many'], { many: ['A', 'B', 'C', 'D', 'E'] }), /\{\n  A,\n  B,\n  C,\n  D,\n  E,\n\}/);
});
