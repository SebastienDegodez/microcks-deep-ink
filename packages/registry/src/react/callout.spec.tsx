import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Callout } from './callout';

describe('Callout outline', () => {
  it('is a note with a named icon, the outline variant and the small size', async () => {
    const { container } = render(
      <div>
        <Callout tone="warning" variant="outline">Install the main package first.</Callout>
        <Callout tone="warning" variant="outline" size="sm" live="polite">Masked token.</Callout>
      </div>,
    );
    const note = screen.getByRole('note');
    expect(note.getAttribute('data-variant')).toBe('outline');
    expect(screen.getAllByRole('img', { name: 'Warning' })).toHaveLength(2);
    const status = screen.getByRole('status');
    expect(status.getAttribute('data-size')).toBe('sm');
    expect(await axeViolations(container)).toEqual([]);
  });
});
