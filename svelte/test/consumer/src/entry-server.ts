import { render } from 'svelte/server';
import App from './App.svelte';

const { body } = render(App);
for (const expected of ['data-protocol="rest"', 'data-size="compact"', 'data-pulse="false"', 'data-line-height="inherit"', 'aria-label="Package smoke"', 'natively', 'Details']) {
  if (!body.includes(expected)) throw new Error(`Packed SSR output missing ${expected}`);
}
console.log('Packed Svelte consumer SSR: all five public components rendered');
