import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { RunMeta } from './run-meta';

describe('RunMeta', () => {
  it('renders key/value pairs in a dl, with kinds and a detail', async () => {
    const { container } = render(
      <RunMeta
        items={[
          { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', kind: 'url' },
          { term: 'Runner', value: 'A2A_CONFORMANCE', kind: 'chip' },
          { term: 'Started', value: 'just now', detail: 'Nov 3, 2026 14:12:08' },
        ]}
      />,
    );
    expect(container.querySelectorAll('dl.run-meta > .run-meta-item')).toHaveLength(3);
    expect(screen.getByText('A2A_CONFORMANCE').getAttribute('data-kind')).toBe('chip');
    expect(screen.getByText('Nov 3, 2026 14:12:08').className).toBe('run-meta-detail');
    expect(await axeViolations(container)).toEqual([]);
  });
});
