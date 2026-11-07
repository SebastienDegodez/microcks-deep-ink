import { render } from 'svelte/server';
import App from './App.svelte';

const { body } = render(App);
for (const expected of ['data-protocol="rest"', 'data-size="compact"', 'data-pulse="false"', 'data-line-height="inherit"', 'aria-label="Package smoke"', 'natively', 'Details', 'data-size="xs"', 'data-tone="link"', 'stroke-dasharray="3 3"', 'Packed <strong>button</strong>', 'Packed link', 'aria-busy="true"', 'tabindex="-1"']) {
  if (!body.includes(expected)) throw new Error(`Packed SSR output missing ${expected}`);
}
if (body.includes('href="/never"')) throw new Error('Loading link must not navigate');
console.log('Packed Svelte consumer SSR: all seven public components rendered');
