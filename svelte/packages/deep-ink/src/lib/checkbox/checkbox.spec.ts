import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Checkbox from './Checkbox.svelte';
import Radio from './Radio.svelte';
import RadioGroup from './RadioGroup.svelte';
import RichRadioFixture from './_RichRadioFixture.svelte';

describe('Checkbox', () => {
  it('is a checkbox named by its label and described by its description, toggled with Space', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    let checked = true;
    const { container } = render(Checkbox, { props: { label: 'Run on every import', description: 'Triggers a test.', onchange, get checked() { return checked; }, set checked(v) { checked = v; } } });
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Run on every import' });
    expect(box.checked).toBe(true);
    expect(box.getAttribute('aria-describedby')).toBe(container.querySelector('.choice-description')!.id);
    await user.tab();
    expect(document.activeElement).toBe(box);
    await user.keyboard(' ');
    expect([box.checked, checked]).toEqual([false, false]);
    expect(onchange).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('toggles from its label, not when disabled, and calls onfocus and onblur', async () => {
    const user = userEvent.setup();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Checkbox, { props: { label: 'Validate', variant: 'card', class: 'mine', onfocus, onblur } });
    render(Checkbox, { props: { label: 'Locked', disabled: true } });
    render(Checkbox, { props: { label: 'Initially on', defaultChecked: true } });
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Validate' });
    expect(box.className).toBe('checkbox mine');
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Initially on' }).checked).toBe(true);
    await user.tab();
    await user.tab();
    expect([onfocus.mock.calls.length, onblur.mock.calls.length]).toEqual([1, 1]);
    await user.click(screen.getByText('Validate'));
    expect(box.checked).toBe(true);
    await user.click(screen.getByText('Locked'));
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Locked' }).checked).toBe(false);
  });
});

describe('Radio', () => {
  it('is a radio named by its label', () => {
    render(Radio, { props: { label: 'Fallback', name: 'd', value: 'fallback' } });
    expect(screen.getByRole('radio', { name: 'Fallback' }).className).toBe('radio');
  });
});

describe('RadioGroup', () => {
  it('renders data-driven labels while preserving selection, updates and disabled options', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const options = [
      { value: 'pastry', label: 'API Pastry', version: '2.0' },
      { value: 'orders', label: 'Orders', version: '1.0', disabled: true },
    ];
    const { rerender } = render(RichRadioFixture, { props: { options, onchange } });
    await user.click(screen.getByText('API Pastry'));
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'API Pastry 2.0' }).checked).toBe(true);
    expect(onchange).toHaveBeenLastCalledWith('pastry');
    await user.click(screen.getByText('Orders'));
    expect(onchange).toHaveBeenCalledOnce();
    await rerender({ options: [{ ...options[0]!, version: '3.0' }] });
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'API Pastry 3.0' }).checked).toBe(true);
    expect(screen.queryByRole('radio', { name: 'Orders 1.0' })).toBeNull();
  });

  const options = [
    { value: 'uri', label: 'URI parts' },
    { value: 'json', label: 'JSON body' },
    { value: 'script', label: 'Script', disabled: true },
  ];

  it('is a group named by its legend, described by help and error; arrows move the selection', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    let value: string | undefined = 'uri';
    const { container } = render(RadioGroup, {
      props: { legend: 'Dispatcher', options, onchange, required: true, help: 'How a request picks its response.', error: 'Pick one.', get value() { return value; }, set value(v) { value = v; } },
    });
    const group = screen.getByRole('radiogroup', { name: 'Dispatcher' });
    expect(group.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'URI parts' }).checked).toBe(true);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(onchange).toHaveBeenLastCalledWith('json');
    expect(value).toBe('json');
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'JSON body' }).checked).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });
});
