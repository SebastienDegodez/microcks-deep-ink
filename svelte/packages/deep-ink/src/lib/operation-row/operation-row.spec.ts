import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import OperationList from './OperationList.svelte';
import OperationRow from './OperationRow.svelte';

describe('OperationList / OperationRow', () => {
  it('labels operation list and marks selected link current with its mock URL', async () => {
    const { container } = render(OperationList, { props: { label: 'Operations of API Pastry', children: undefined } });
    // Child rows are tested as independent native list entries below.
    expect(container.querySelector('ul')?.getAttribute('aria-label')).toBe('Operations of API Pastry');
    const row = render(OperationRow, { props: { method: 'GET', path: '/pastries', href: '#a', meta: '3 examples', selected: true, mockUrl: 'http://m/pastries' } });
    expect(screen.getByRole('link').getAttribute('aria-current')).toBe('true');
    expect(row.container.querySelector('.operation-mock')).toBeTruthy();
  });
  it('invokes onselect only for interactive button rows', async () => {
    const onselect = vi.fn();
    render(OperationRow, { props: { method: 'GET', path: '/a', onselect } });
    await fireEvent.click(screen.getByRole('button'));
    expect(onselect).toHaveBeenCalledOnce();
  });
});
