import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SummaryStrip from './SummaryStrip.svelte';
import SummaryStripSep from './SummaryStripSep.svelte';

describe('SummaryStrip', () => {
  it('is a named note with hidden separators', async () => {
    const { container } = render(SummaryStrip, {
      props: {
        role: 'note',
        'aria-label': 'Saved behaviour',
        gap: 'roomy',
        parts: [{ text: 'Saved', kind: 'label' }, { text: 'URI_PARTS · rule: name' }, { text: 'delay 0 ms fixed', sep: true }],
      },
    });
    const note = screen.getByRole('note', { name: 'Saved behaviour' });
    expect(note.getAttribute('data-gap')).toBe('roomy');
    expect(note.querySelectorAll('.summary-strip-sep[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.getByText('Saved').className).toBe('summary-strip-label');
    expect(screen.getByText('delay 0 ms fixed').className).toBe('summary-strip-value');
    expect(note.hasAttribute('data-variant')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('exposes the canvas variant', () => {
    render(SummaryStrip, { props: { role: 'note', 'aria-label': 'Test setup', variant: 'canvas', parts: [{ text: 'Setup', kind: 'label' }, { text: 'JSON-RPC 2.0' }] } });
    expect(screen.getByRole('note', { name: 'Test setup' }).getAttribute('data-variant')).toBe('canvas');
  });

  it('takes snippet parts and free content after them, and SummaryStripSep is a hidden separator', async () => {
    const link = createRawSnippet(() => ({ render: () => '<a href="/svc">API Pastry</a>' }));
    const { container } = render(SummaryStrip, { props: { values: 'text', parts: [{ text: link }], children: createRawSnippet(() => ({ render: () => '<code>v2</code>' })) } });
    expect(screen.getByRole('link', { name: 'API Pastry' }).parentElement!.className).toBe('summary-strip-value');
    expect(container.querySelector('.summary-strip')!.lastElementChild!.localName).toBe('code');
    expect(container.querySelector('.summary-strip')!.getAttribute('data-values')).toBe('text');
    const sep = render(SummaryStripSep).container.querySelector('span')!;
    expect([sep.className, sep.getAttribute('aria-hidden')]).toEqual(['summary-strip-sep', 'true']);
    expect(await axeViolations(container)).toEqual([]);
  });
});
