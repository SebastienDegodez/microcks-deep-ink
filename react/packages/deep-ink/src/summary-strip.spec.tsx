import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { SummaryStrip } from './summary-strip';

describe('SummaryStrip', () => {
  it('is a named note with hidden separators', async () => {
    const { container } = render(
      <SummaryStrip
        role="note"
        aria-label="Saved behaviour"
        gap="roomy"
        parts={[{ text: 'Saved', kind: 'label' }, { text: 'URI_PARTS · rule: name' }, { text: 'delay 0 ms fixed', sep: true }]}
      />,
    );
    const note = screen.getByRole('note', { name: 'Saved behaviour' });
    expect(note.getAttribute('data-gap')).toBe('roomy');
    expect(note.querySelectorAll('.summary-strip-sep[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.getByText('Saved').className).toBe('summary-strip-label');
    expect(screen.getByText('delay 0 ms fixed').className).toBe('summary-strip-value');
    expect(note.hasAttribute('data-variant')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('exposes the canvas variant', () => {
    render(<SummaryStrip role="note" aria-label="Test setup" variant="canvas" parts={[{ text: 'Setup', kind: 'label' }, { text: 'JSON-RPC 2.0' }]} />);
    expect(screen.getByRole('note', { name: 'Test setup' }).getAttribute('data-variant')).toBe('canvas');
  });

  it('keeps line-height fixed by default and inherits it on demand', () => {
    const { rerender } = render(<SummaryStrip role="note" aria-label="Dispatcher" parts={[{ text: 'Dispatcher', kind: 'label' }]} />);
    expect(screen.getByRole('note').hasAttribute('data-line-height')).toBe(false);
    rerender(<SummaryStrip role="note" aria-label="Dispatcher" lineHeight="inherit" parts={[{ text: 'Dispatcher', kind: 'label' }]} />);
    expect(screen.getByRole('note').getAttribute('data-line-height')).toBe('inherit');
  });
});
