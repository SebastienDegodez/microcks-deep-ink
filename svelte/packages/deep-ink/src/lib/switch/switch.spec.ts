import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Switch from './Switch.svelte';

describe('Switch size', () => {
  it('has a large size', () => {
    render(Switch, { props: { label: 'Stateful', size: 'lg', checked: true, oncheckedchange: () => {} } });
    expect(screen.getByRole('switch', { name: 'Stateful' }).getAttribute('data-size')).toBe('lg');
  });
});

describe('Switch', () => {
  it('is a switch named by its label, described by its description, toggled with Space', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const oncheckedchange = vi.fn();
    let checked = false;
    const { container } = render(Switch, { props: { label: 'Record traffic', description: 'Keeps the last 1,000 calls.', onchange, oncheckedchange, get checked() { return checked; }, set checked(v) { checked = v; } } });
    const sw = screen.getByRole<HTMLInputElement>('switch', { name: 'Record traffic' });
    expect(sw.getAttribute('aria-describedby')).toBe(container.querySelector('.choice-description')!.id);
    await user.tab();
    expect(document.activeElement).toBe(sw);
    await user.keyboard(' ');
    expect(oncheckedchange).toHaveBeenLastCalledWith(true);
    expect(onchange).toHaveBeenCalledOnce();
    expect(onchange.mock.calls[0]![0]).toBeInstanceOf(Event);
    expect([sw.checked, checked]).toEqual([true, true]);
    await user.click(screen.getByText('Record traffic'));
    expect(oncheckedchange).toHaveBeenLastCalledWith(false);
    expect(onchange).toHaveBeenCalledTimes(2);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is not toggled when disabled', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    render(Switch, { props: { label: 'Managed', checked: true, disabled: true, onchange } });
    await user.click(screen.getByRole('switch', { name: 'Managed' }));
    expect(onchange).not.toHaveBeenCalled();
  });
});
