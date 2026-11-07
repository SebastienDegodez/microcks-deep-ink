import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Switch from './Switch.svelte';

describe('Switch size', () => {
  it('has a large size', () => {
    render(Switch, { props: { label: 'Stateful', size: 'lg', checked: true, onChange: () => {} } });
    expect(screen.getByRole('switch', { name: 'Stateful' }).getAttribute('data-size')).toBe('lg');
  });
});

describe('Switch', () => {
  it('is a switch named by its label, described by its description, toggled with Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let checked = false;
    const { container } = render(Switch, { props: { label: 'Record traffic', description: 'Keeps the last 1,000 calls.', onChange, get checked() { return checked; }, set checked(v) { checked = v; } } });
    const sw = screen.getByRole<HTMLInputElement>('switch', { name: 'Record traffic' });
    expect(sw.getAttribute('aria-describedby')).toBe(container.querySelector('.choice-description')!.id);
    await user.tab();
    expect(document.activeElement).toBe(sw);
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect([sw.checked, checked]).toEqual([true, true]);
    await user.click(screen.getByText('Record traffic'));
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is not toggled when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(Switch, { props: { label: 'Managed', checked: true, disabled: true, onChange } });
    await user.click(screen.getByRole('switch', { name: 'Managed' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
