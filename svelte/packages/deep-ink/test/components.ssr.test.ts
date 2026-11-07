import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import Composition from './Composition.svelte';
import { LiveIndicator } from '../src/lib/index.js';

it('server-renders native snippets, attributes and the mandatory outcome word', () => {
  const { body } = render(Composition, { props: { onclick: () => {} } });
  expect(body).toContain('data-protocol="rest"');
  expect(body).toContain('aria-hidden="true"');
  expect(body).toContain('View services');
  expect(body).toContain('Failed');
  expect(body).toContain('<strong>3</strong>');
});

it('server-renders meaningful paused whitespace and a hidden dot label', () => {
  const { body } = render(LiveIndicator, { props: { paused: true, variant: 'dot', pulse: false } });
  expect(body).toContain('sr-only');
  expect(body).toContain(' · paused');
  expect(body).toContain('data-pulse="false"');
  expect(body).not.toContain('aria-live');
});
