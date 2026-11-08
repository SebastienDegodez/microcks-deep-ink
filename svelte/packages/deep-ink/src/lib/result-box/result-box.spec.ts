import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ResultBox from './ResultBox.svelte';
const html = (s: string) => createRawSnippet(() => ({ render: () => s }));
describe('ResultBox', () => {
  it('provides a status box with decorative icon and dismiss handler', async () => {
    const ondismiss = vi.fn(); const { container } = render(ResultBox, { props: { size: 'md', ondismiss, children: html('Secret created.') } });
    const status = screen.getByRole('status'); expect(status.querySelector('.result-box-icon')?.getAttribute('aria-hidden')).toBe('true');
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' })); expect(ondismiss).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });
  it('supports flat raised and compact status variants', async () => {
    const { container } = render(ResultBox, { props: { tone: 'danger', icon: 'cross', title: 'Terminal task', bordered: false, surface: 'raised', live: 'off', children: html('Do not resume.') } });
    const box = container.querySelector('.result-box') as HTMLElement; expect(box.dataset.bordered).toBe('false'); expect(box.dataset.surface).toBe('raised'); expect(box.hasAttribute('role')).toBe(false);
    const compact = render(ResultBox, { props: { tone: 'info', density: 'compact', children: html('<strong>Pastry orders events</strong> deleted.') } });
    expect(compact.getByRole('status').dataset.density).toBe('compact'); expect(compact.container.querySelector('.result-box-icon')).toBeNull();
    expect(await axeViolations(compact.container)).toEqual([]);
  });
});
