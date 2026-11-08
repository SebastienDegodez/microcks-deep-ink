import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import OpPickList from './OpPickList.svelte';
const options = [{ id: 'list', method: 'GET', path: '/pastries', summary: 'List pastries' }, { id: 'patch', method: 'PATCH', path: '/pastries/{name}' }];
describe('OpPickList', () => {
  it('uses named toggle buttons and calls onchange', async () => {
    const onchange = vi.fn(); const { container } = render(OpPickList, { props: { label: 'Operations', options, value: 'list', onchange } });
    expect(screen.getByRole('list', { name: 'Operations' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /GET \/pastries List pastries/ }).getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(screen.getByRole('button', { name: /PATCH/ })); expect(onchange).toHaveBeenCalledWith('patch');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('radio mode has roving tab stop and wraps on arrows', async () => {
    const onchange = vi.fn(); const { container } = render(OpPickList, { props: { mode: 'radio', label: 'Operations', options, value: 'list', onchange } });
    const radios = screen.getAllByRole('radio'); expect(radios.map((r) => (r as HTMLButtonElement).tabIndex)).toEqual([0, -1]);
    await fireEvent.keyDown(radios[0]!, { key: 'ArrowUp' });
    expect(onchange).toHaveBeenCalledWith('patch'); expect(document.activeElement).toBe(radios[1]);
    expect(await axeViolations(container)).toEqual([]);
  });
});
