// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatusBadge, type Outcome } from './status-badge';

afterEach(cleanup);

const WORDS: Record<Outcome, string> = {
  conformant: 'Conformant',
  failed: 'Failed',
  partial: 'Partial',
  running: 'Running',
  never: 'Never tested',
};

describe('StatusBadge', () => {
  it.each(Object.entries(WORDS))('renders the word for %s', (status, word) => {
    render(<StatusBadge status={status as Outcome} />);
    expect(screen.getByText(word)).toBeTruthy();
  });

  it('keeps the icon decorative', () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lets the label replace the word but never removes it', () => {
    render(<StatusBadge status="partial" label="2 of 3 pass" />);
    expect(screen.getByText('2 of 3 pass')).toBeTruthy();
  });

  it('rings summary icons and dashes "never tested"', () => {
    const { container } = render(<StatusBadge status="never" />);
    expect(container.querySelector('.status')?.getAttribute('data-shape')).toBe('circled');
    expect(container.querySelector('path[stroke-dasharray]')).toBeTruthy();
  });

  it('draws a bare check for step outcomes', () => {
    const { container } = render(<StatusBadge status="conformant" shape="bare" />);
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12l5 5 9-11');
  });
});
