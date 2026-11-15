import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { OperationList, OperationRow } from './operation-row';

describe('OperationList / OperationRow', () => {
  it('renders a named list of link rows; the selected one is current and shows its mock URL', async () => {
    const { container } = render(
      <OperationList label="Operations of API Pastry">
        <OperationRow method="GET" path="/pastries" href="#a" meta="3 examples" selected mockUrl="http://m/pastries" />
        <OperationRow method="POST" path="/pastries" href="#b" />
      </OperationList>,
    );
    expect(screen.getByRole('list', { name: 'Operations of API Pastry' })).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links[0]!.getAttribute('aria-current')).toBe('true');
    expect(links[1]!.hasAttribute('aria-current')).toBe(false);
    expect(container.querySelectorAll('.operation-mock')).toHaveLength(1);
    expect(container.querySelector('.operation-meta')!.textContent).toBe('3 examples');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is a button with onSelect, and static otherwise', () => {
    const onSelect = vi.fn();
    render(
      <ul>
        <OperationRow method="GET" path="/a" onSelect={onSelect} />
        <OperationRow method="GET" path="/b" />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
