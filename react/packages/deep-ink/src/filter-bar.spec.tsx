import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { FilterBar, FilterReset, FilterRow, FilterSearch } from './filter-bar';

describe('FilterBar', () => {
  it('names the region, the search field and the titled rows', async () => {
    const onReset = vi.fn();
    const { container } = render(
      <FilterBar label="Catalogue filters">
        <FilterRow>
          <FilterSearch label="Search APIs and services" />
        </FilterRow>
        <FilterRow title="Protocol">
          <button type="button" aria-pressed="false">REST</button>
          <FilterReset count={1} onClick={onReset} />
        </FilterRow>
      </FilterBar>,
    );
    expect(screen.getByRole('region', { name: 'Catalogue filters' })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search APIs and services' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Protocol' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset (1)' }));
    expect(onReset).toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('disables Reset when no filter is active', () => {
    render(<FilterReset count={0} />);
    expect((screen.getByRole('button', { name: 'Reset (0)' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
