import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { Chip } from './chip';
import { FilterSearch } from './filter-bar';
import { LiveIndicator } from './live-indicator';

describe('Hub review options', () => {
  it('live indicator box variant and lg size', () => {
    render(<LiveIndicator variant="box" size="lg" label="live · fetching and importing artifacts" />);
    const el = screen.getByText('live · fetching and importing artifacts');
    expect(el.getAttribute('data-variant')).toBe('box');
    expect(el.getAttribute('data-size')).toBe('lg');
  });

  it('category pill chip is a toggle with its count in the name', () => {
    render(
      <div role="group" aria-label="Categories">
        <Chip size="lg" count={8} pressed>All</Chip>
        <Chip size="lg" count={3} pressed={false}>Samples</Chip>
      </div>,
    );
    const all = screen.getByRole('button', { name: 'All 8' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    expect(all.getAttribute('data-size')).toBe('lg');
  });

  it('large filter search keeps its hidden label', async () => {
    const { container } = render(<FilterSearch size="lg" label="Search packages and APIs" placeholder="Search packages, APIs, protocols…" />);
    expect(screen.getByRole('searchbox', { name: 'Search packages and APIs' }).closest('label')?.getAttribute('data-size')).toBe('lg');
    expect(await axeViolations(container)).toEqual([]);
  });
});
