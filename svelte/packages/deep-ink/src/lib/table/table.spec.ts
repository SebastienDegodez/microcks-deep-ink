import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import DataTable from './DataTable.svelte';
import { sortRows, type DataTableColumn, type RowLinkProps, type SortState } from './table';

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
const base = { caption: 'Services', columns, rows, rowKey: 'id' as const };

describe('DataTable', () => {
  it('keeps the table and sort announcement text adjacent without a formatting space', async () => {
    const { rerender } = render(DataTable<Svc>, { props: base });
    const region = screen.getByRole('region', { name: 'Services' });
    const text = 'ServicesNameVersionCalls (24h)API Pastry2.01204Orders API0.1.0388';
    expect(region.textContent).toBe(text);
    await rerender({ sort: { key: 'name', direction: 'ascending' } });
    expect(region.textContent).toBe(`${text}Sorted by Name, ascending`);
  });

  it('has a caption, column headers with scope and a focusable named region', () => {
    render(DataTable<Svc>, { props: base });
    const table = screen.getByRole('table', { name: 'Services' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    for (const th of headers) expect(th.getAttribute('scope')).toBe('col');
    const region = screen.getByRole('region', { name: 'Services' });
    expect(region.tabIndex).toBe(0);
  });

  it('can hide the caption visually but keeps it for assistive technology', () => {
    render(DataTable<Svc>, { props: { ...base, captionHidden: true } });
    expect(document.querySelector('caption')?.className).toContain('sr-only');
    expect(screen.getByRole('table', { name: 'Services' })).toBeTruthy();
  });

  it('sets aria-sort only on the sorted column and asks for the next direction', async () => {
    const onsortchange = vi.fn();
    const sort: SortState = { key: 'name', direction: 'ascending' };
    render(DataTable<Svc>, { props: { ...base, sort, onsortchange } });
    const name = screen.getByRole('columnheader', { name: /Name/ });
    expect(name.getAttribute('aria-sort')).toBe('ascending');
    expect(screen.getByRole('columnheader', { name: /Calls/ }).hasAttribute('aria-sort')).toBe(false);
    expect(screen.getByRole('columnheader', { name: 'Version' }).hasAttribute('aria-sort')).toBe(false);
    await fireEvent.click(within(name).getByRole('button'));
    expect(onsortchange).toHaveBeenLastCalledWith({ key: 'name', direction: 'descending' });
    await fireEvent.click(within(screen.getByRole('columnheader', { name: /Calls/ })).getByRole('button'));
    expect(onsortchange).toHaveBeenLastCalledWith({ key: 'calls', direction: 'ascending' });
    expect(screen.getByRole('status').textContent).toBe('Sorted by Name, ascending');
  });

  it('puts a real link in the first cell and marks the selected row', () => {
    render(DataTable<Svc>, { props: { ...base, rowHref: (r: Svc) => `/services/${r.id}`, selectedKey: 'orders' } });
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
    render(DataTable<Svc>, { props: { ...base, rows: [], emptyText: 'No services match.' } });
    expect(screen.getByText('No services match.')).toBeTruthy();
  });

  it('sortRows sorts numbers numerically and text naturally', () => {
    expect(sortRows(rows, { key: 'calls', direction: 'ascending' }).map((r) => r.id)).toEqual(['orders', 'pastry2']);
    expect(sortRows(rows, { key: 'name', direction: 'descending' }).map((r) => r.id)).toEqual(['orders', 'pastry2']);
  });

  it('sentence-case headers and row tones', () => {
    const { container } = render(DataTable<Svc>, { props: { ...base, headerCase: 'sentence', rowTone: (r: Svc) => (r.id === 'orders' ? 'idle' : 'failed') } });
    expect(container.querySelector('table')?.getAttribute('data-header')).toBe('sentence');
    const trs = container.querySelectorAll('tbody tr');
    expect(trs[0]!.getAttribute('data-tone')).toBe('failed');
    expect(trs[1]!.getAttribute('data-tone')).toBe('idle');
  });

  it('row header columns and the danger row tone', async () => {
    const { container } = render(DataTable<Svc>, {
      props: { ...base, caption: 'Example parameters', headerCase: 'sentence', columns: [{ ...columns[0]!, sortable: false, rowHeader: true }, columns[1]!], rowTone: (r: Svc) => (r.id === 'orders' ? 'danger' : undefined) },
    });
    expect(screen.getByRole('rowheader', { name: 'API Pastry' })).toBeTruthy();
    expect(container.querySelectorAll('tbody tr')[1]!.getAttribute('data-tone')).toBe('danger');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no axe violations', async () => {
    const { container } = render(DataTable<Svc>, { props: { ...base, rowHref: (r: Svc) => `/s/${r.id}`, selectedKey: 'orders', sort: { key: 'name', direction: 'ascending' } } });
    expect(await axeViolations(container)).toEqual([]);
  });

  it('can hide a column header visually but keep it for assistive technology', () => {
    render(DataTable<{ name: string; id: string }>, { props: { caption: 'Svc', columns: [{ key: 'name', header: 'Name' }, { key: 'id', header: 'Open', headerHidden: true }], rows: [{ name: 'A', id: 'a' }], rowKey: 'id' } });
    const th = screen.getByRole('columnheader', { name: 'Open' });
    expect(th.querySelector('.sr-only')?.textContent).toBe('Open');
  });

  it('scroll={false} drops the focusable region; the table keeps its name', () => {
    const { container } = render(DataTable<Svc>, { props: { ...base, scroll: false } });
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('table', { name: 'Services' })).toBeTruthy();
    const wrap = container.querySelector('.table-wrap')!;
    expect(wrap.hasAttribute('tabindex')).toBe(false);
    expect(wrap.getAttribute('data-scroll')).toBe('false');
  });

  it('defaults keep the scroll region, the auto layout and no column width', () => {
    const { container } = render(DataTable<Svc>, { props: base });
    expect(screen.getByRole('region', { name: 'Services' }).hasAttribute('data-scroll')).toBe(false);
    expect(container.querySelector('table')!.hasAttribute('data-layout')).toBe(false);
    for (const th of screen.getAllByRole('columnheader')) expect(th.getAttribute('style')).toBeNull();
    expect(screen.queryByRole('button', { pressed: false })).toBeNull();
  });

  it('layout="fixed" sets the column widths on the headers', () => {
    const { container } = render(DataTable<Svc>, { props: { ...base, layout: 'fixed', columns: [{ ...columns[0]!, width: '116px' }, { ...columns[1]!, width: '31%' }, columns[2]!] } });
    expect(container.querySelector('table')!.getAttribute('data-layout')).toBe('fixed');
    expect((screen.getByRole('columnheader', { name: /Name/ }) as HTMLElement).style.width).toBe('116px');
    expect((screen.getByRole('columnheader', { name: 'Version' }) as HTMLElement).style.width).toBe('31%');
    expect((screen.getByRole('columnheader', { name: /Calls/ }) as HTMLElement).style.width).toBe('');
  });

  it('a selectable row header is a toggle button named by the row, pressed on the selected row', async () => {
    const onrowselect = vi.fn();
    const cols: DataTableColumn<Svc>[] = [{ key: 'name', header: 'Name', rowHeader: true }, columns[1]!];
    const { container } = render(DataTable<Svc>, { props: { ...base, scroll: false, layout: 'fixed', columns: cols, selectedKey: 'orders', onrowselect } });
    const orders = within(screen.getByRole('rowheader', { name: 'Orders API' })).getByRole('button', { name: 'Orders API' });
    expect(orders.getAttribute('aria-pressed')).toBe('true');
    const pastry = screen.getByRole('button', { name: 'API Pastry', pressed: false });
    // No hidden "Selected:" prefix: aria-pressed carries the state and the button keeps the row name.
    expect(container.textContent).not.toContain('Selected:');
    pastry.focus();
    expect(document.activeElement).toBe(pastry);
    await fireEvent.click(pastry);
    expect(onrowselect).toHaveBeenCalledWith(rows[0]);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('keyboard: the tab order is the toggles in row order, never the wrapper, when scroll={false}', async () => {
    const onrowselect = vi.fn();
    const { container } = render(DataTable<Svc>, { props: { ...base, scroll: false, columns: [{ key: 'name', header: 'Name', rowHeader: true }, columns[1]!], onrowselect } });
    const tabbable = [...container.querySelectorAll<HTMLElement>('a[href], button, [tabindex]')].filter((el) => el.tabIndex >= 0);
    expect(tabbable.map((el) => el.textContent)).toEqual(['API Pastry', 'Orders API']);
    for (const el of tabbable) expect(el.tagName).toBe('BUTTON');
    // A native button: Enter and Space activate it (a click), no key handler of its own.
    tabbable[1]!.focus();
    await fireEvent.click(document.activeElement!);
    expect(onrowselect).toHaveBeenLastCalledWith(rows[1]);
  });

  it('renders a column snippet in the cells and a custom row link with the RowLinkProps', () => {
    const calls = createRawSnippet((row: () => Svc) => ({ render: () => `<b>${row().calls} calls</b>` }));
    const seen: RowLinkProps[] = [];
    const renderRowLink = createRawSnippet((row: () => Svc, props: () => RowLinkProps) => {
      seen.push(props());
      return { render: () => `<a class="${props().class}" href="${props().href}" data-router="">${row().name}</a>` };
    });
    const { container } = render(DataTable<Svc>, {
      props: { ...base, columns: [columns[0]!, { ...columns[2]!, render: calls }], rowHref: (r: Svc) => `/s/${r.id}`, selectedKey: 'orders', renderRowLink },
    });
    expect(screen.getByRole('link', { name: 'Orders API' }).hasAttribute('data-router')).toBe(true);
    expect(seen.map((p) => [p.class, p.href, p['aria-current'], typeof p.children])).toEqual([
      ['table-rowlink', '/s/pastry2', undefined, 'function'],
      ['table-rowlink', '/s/orders', 'true', 'function'],
    ]);
    expect([...container.querySelectorAll('td b')].map((b) => b.textContent)).toEqual(['1204 calls', '388 calls']);
  });
});
