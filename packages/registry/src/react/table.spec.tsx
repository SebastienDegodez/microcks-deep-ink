import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { DataTable, sortRows } from './table';
import type { DataTableColumn, SortState } from './table';

interface Svc {
  id: string;
  name: string;
  version: string;
  calls: number;
}
const rows: Svc[] = [
  { id: 'pastry2', name: 'API Pastry', version: '2.0', calls: 1204 },
  { id: 'orders', name: 'Orders API', version: '0.1.0', calls: 388 },
];
const columns: DataTableColumn<Svc>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'version', header: 'Version', mono: true },
  { key: 'calls', header: 'Calls (24h)', align: 'end', sortable: true },
];

describe('DataTable', () => {
  it('has a caption, column headers with scope and a focusable named region', () => {
    render(<DataTable caption="Services" columns={columns} rows={rows} rowKey="id" />);
    const table = screen.getByRole('table', { name: 'Services' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    for (const th of headers) expect(th.getAttribute('scope')).toBe('col');
    const region = screen.getByRole('region', { name: 'Services' });
    expect(region.tabIndex).toBe(0);
  });

  it('can hide the caption visually but keeps it for assistive technology', () => {
    render(<DataTable caption="Services" captionHidden columns={columns} rows={rows} rowKey="id" />);
    expect(document.querySelector('caption')?.className).toContain('di-sr-only');
    expect(screen.getByRole('table', { name: 'Services' })).toBeTruthy();
  });

  it('sets aria-sort only on the sorted column and asks for the next direction', () => {
    const onSortChange = vi.fn();
    const sort: SortState = { key: 'name', direction: 'ascending' };
    render(<DataTable caption="Services" columns={columns} rows={rows} rowKey="id" sort={sort} onSortChange={onSortChange} />);
    const name = screen.getByRole('columnheader', { name: /Name/ });
    expect(name.getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('columnheader', { name: /Calls/ }).hasAttribute('aria-sort')).toBe(false);
    expect(screen.getByRole('columnheader', { name: 'Version' }).hasAttribute('aria-sort')).toBe(false);
    fireEvent.click(within(name).getByRole('button'));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'descending' });
    fireEvent.click(within(screen.getByRole('columnheader', { name: /Calls/ })).getByRole('button'));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'calls', direction: 'ascending' });
    expect(screen.getByRole('status').textContent).toBe('Sorted by Name, ascending');
  });

  it('puts a real link in the first cell and marks the selected row', () => {
    render(<DataTable caption="Services" columns={columns} rows={rows} rowKey="id" rowHref={(r) => `/services/${r.id}`} selectedKey="orders" />);
    const link = screen.getByRole('link', { name: 'Orders API' });
    expect(link.getAttribute('href')).toBe('/services/orders');
    expect(link.getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('link', { name: 'API Pastry' }).hasAttribute('aria-current')).toBe(false);
    expect(link.closest('tr')?.hasAttribute('data-selected')).toBe(true);
    // No clickable rows: tr elements carry no handlers or roles.
    for (const tr of document.querySelectorAll('tbody tr')) {
      expect(tr.getAttribute('role')).toBeNull();
      expect(tr.getAttribute('tabindex')).toBeNull();
    }
  });

  it('renders the empty text', () => {
    render(<DataTable caption="Services" columns={columns} rows={[]} rowKey="id" emptyText="No services match." />);
    expect(screen.getByText('No services match.')).toBeTruthy();
  });

  it('sortRows sorts numbers numerically and text naturally', () => {
    expect(sortRows(rows, { key: 'calls', direction: 'ascending' }).map((r) => r.id)).toEqual(['orders', 'pastry2']);
    expect(sortRows(rows, { key: 'name', direction: 'descending' }).map((r) => r.id)).toEqual(['orders', 'pastry2']);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DataTable caption="Services" columns={columns} rows={rows} rowKey="id" rowHref={(r) => `/s/${r.id}`} selectedKey="orders" sort={{ key: 'name', direction: 'ascending' }} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
