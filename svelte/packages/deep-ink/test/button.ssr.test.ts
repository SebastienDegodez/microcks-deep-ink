import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Button, ButtonLink } from '../src/lib/index.js';
import Harness from './ButtonHarness.svelte';

it('server-renders native action/link content and loading without client effects', () => {
  const { body } = render(Harness, { props: { props: { icon: 'copy', size: 'xs', variant: 'outline', tone: 'link', loading: true }, linkProps: { href: '/next' } } });
  expect(body).toContain('type="button"');
  expect(body).toContain('disabled');
  expect(body).toContain('aria-busy="true"');
  expect(body).toContain('data-size="xs"');
  expect(body).toContain('data-tone="link"');
  expect(body).toContain('<strong>changes</strong>');
  expect(body).toContain('href="/next"');
  expect(body).toContain('aria-hidden="true"');
});

it('server-renders inactive links without href or a tab stop', () => {
  for (const props of [{ loading: true }, { disabled: true }, { 'aria-disabled': true as const }]) {
    const { body } = render(ButtonLink, { props: { href: '/unsafe', ...props } });
    expect(body).not.toContain('href=');
    expect(body).toContain('loading' in props ? 'aria-busy="true"' : 'aria-disabled="true"');
    expect(body).toContain('tabindex="-1"');
  }
});

it('preserves the CSS contract on both native element types', () => {
  for (const kind of ['button', 'anchor']) {
    const props = { icon: 'plus', iconOnly: true, 'aria-label': 'Add', confirm: true, variant: 'danger', class: { extra: true } } as const;
    const { body } = kind === 'button' ? render(Button, { props }) : render(ButtonLink, { props });
    expect(body).toContain('class="button extra"');
    expect(body).toContain('data-icon-only=""');
    expect(body).toContain('data-confirm=""');
    expect(body).not.toContain('asChild');
  }
});
