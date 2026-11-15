import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import CiPanel from './CiPanel.svelte';
describe('CiPanel', () => {
  it('names the region by its title with dashed frame, Copy and command', async () => {
    const { container } = render(CiPanel, { id: 'ci', dashed: true, title: 'Run this test in your pipeline', hint: 'Proposed, not available today.', command: "microcks test 'Pastry Concierge:1.0'", footnote: 'Add --keycloakClientId when auth is on.' });
    const region = screen.getByRole('region', { name: 'Run this test in your pipeline' });
    expect(region.id).toBe('ci');
    expect(region.getAttribute('data-dashed')).toBe('');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    expect(region.querySelector('pre')?.textContent).toBe("microcks test 'Pastry Concierge:1.0'");
    expect(await axeViolations(container)).toEqual([]);
  });
  it('takes a copy label and copies the command through keyboard activation', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(CiPanel, { title: 'CI', command: 'microcks test', copyLabel: 'Copy command' });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Copy command' }));
    await user.keyboard('{Enter}');
    expect(write).toHaveBeenCalledWith('microcks test');
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });
});
