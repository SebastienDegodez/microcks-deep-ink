import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { StatCard, StatGrid } from './stat-card';

describe('StatCard', () => {
  it('is a region named by its heading, with the figure as text', async () => {
    const { container } = render(
      <StatGrid label="Key figures">
        <StatCard title="APIs & services" value="11" unit="29 operations" action={<a href="#/services">Catalogue</a>} />
        <StatCard title="Average conformance" value="78%" unit="current score" tone="warning">
          <p>Across 8 tested services</p>
        </StatCard>
      </StatGrid>,
    );
    expect(screen.getByRole('region', { name: 'Key figures' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Average conformance' });
    expect(card.getAttribute('data-tone')).toBe('warning');
    expect(screen.getByRole('heading', { level: 2, name: 'APIs & services' })).toBeTruthy();
    expect(screen.getByText('78%').closest('p')?.textContent).toBe('78%current score');
    expect(await axeViolations(container)).toEqual([]);
  });
});
