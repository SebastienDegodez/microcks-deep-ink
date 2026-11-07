import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import RunMeta from './RunMeta.svelte';

describe('RunMeta', () => {
  it('renders key/value pairs in a dl, with kinds and a detail', async () => {
    const { container } = render(RunMeta, {
      props: {
        items: [
          { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', kind: 'url' },
          { term: 'Runner', value: 'A2A_CONFORMANCE', kind: 'chip' },
          { term: 'Started', value: 'just now', detail: 'Nov 3, 2026 14:12:08' },
        ],
      },
    });
    expect(container.querySelectorAll('dl.run-meta > .run-meta-item')).toHaveLength(3);
    expect(screen.getByText('A2A_CONFORMANCE').getAttribute('data-kind')).toBe('chip');
    expect(screen.getByText('Nov 3, 2026 14:12:08').className).toBe('run-meta-detail');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes a snippet value, such as a real link for a url', async () => {
    const link = createRawSnippet(() => ({ render: () => '<a href="https://concierge.acme.io/a2a">https://concierge.acme.io/a2a</a>' }));
    const { container } = render(RunMeta, { props: { items: [{ term: 'Endpoint', value: link, kind: 'url' }] } });
    expect(screen.getByRole('link', { name: 'https://concierge.acme.io/a2a' }).parentElement!.dataset.kind).toBe('url');
    expect(await axeViolations(container)).toEqual([]);
  });
});
