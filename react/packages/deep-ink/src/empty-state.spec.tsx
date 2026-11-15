import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('is a section named by its heading, with body and actions', async () => {
    const { container } = render(
      <EmptyState title="No results" icon="search-x" actions={<button type="button">Reset</button>}>
        Try another filter.
      </EmptyState>,
    );
    const region = screen.getByRole('region', { name: 'No results' });
    expect(region.getAttribute('data-align')).toBe('center');
    expect(screen.getByRole('heading', { level: 2, name: 'No results' })).toBeTruthy();
    expect(region.querySelector('.empty-body')!.textContent).toBe('Try another filter.');
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('honours headingLevel and align, and omits empty parts', () => {
    const { container } = render(<EmptyState title="Nothing" headingLevel={3} align="start" />);
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
    expect(container.querySelector('.empty')!.getAttribute('data-align')).toBe('start');
    expect(container.querySelector('.empty-icon, .empty-body, .empty-actions')).toBeNull();
  });
});
