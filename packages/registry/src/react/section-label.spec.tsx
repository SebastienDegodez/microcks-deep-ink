import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { SectionLabel } from './section-label';

describe('SectionLabel', () => {
  it('renders the chosen element, keeps the text case and exposes size and weight', async () => {
    const { container } = render(
      <div>
        <SectionLabel as="h3">Endpoints</SectionLabel>
        <SectionLabel as="label" htmlFor="u">Mock URL</SectionLabel>
        <input id="u" defaultValue="https://mock" />
        <SectionLabel size="sm" weight="regular" split><span>3 operations</span><span>calls · 7 d</span></SectionLabel>
      </div>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Endpoints' }).className).toBe('section-label');
    expect(screen.getByRole('textbox', { name: 'Mock URL' })).toBeTruthy();
    const caption = screen.getByText('3 operations').parentElement!;
    expect(caption.getAttribute('data-size')).toBe('sm');
    expect(caption.getAttribute('data-weight')).toBe('regular');
    expect(caption.hasAttribute('data-split')).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });
});
