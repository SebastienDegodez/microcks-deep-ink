// Chip, Panel and Segmented: small presentational pieces with a few semantics to protect.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { Chip } from './chip';
import { Panel } from './panel';
import { Segmented } from './segmented';

describe('Chip', () => {
  it('is a plain span when static', () => {
    render(<Chip labelKey="domain">pastry</Chip>);
    const el = screen.getByText('pastry').closest('.chip')!;
    expect(el.tagName).toBe('SPAN');
    expect(el.textContent).toBe('domain=pastry');
  });

  it('becomes a toggle button with aria-pressed', () => {
    const onClick = vi.fn();
    render(
      <Chip pressed={false} onClick={onClick}>
        REST
      </Chip>,
    );
    const b = screen.getByRole('button', { name: 'REST' });
    expect(b.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalled();
  });

  it('has a named remove button', () => {
    const onRemove = vi.fn();
    render(
      <Chip labelKey="team" onRemove={onRemove}>
        payments
      </Chip>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove team payments' }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('reads a protocol filter as its text and count, with no check mark', () => {
    render(
      <Chip protocol="REST" count={4} pressed>
        REST
      </Chip>,
    );
    const b = screen.getByRole('button', { name: 'REST 4', pressed: true });
    expect(b.getAttribute('data-protocol')).toBe('rest');
  });
});

describe('Panel', () => {
  it('is a section labelled by its heading at the requested level', () => {
    render(
      <Panel title="Operations" headingLevel={3} actions={<button type="button">Add</button>}>
        body
      </Panel>,
    );
    const heading = screen.getByRole('heading', { level: 3, name: 'Operations' });
    expect(screen.getByRole('region', { name: 'Operations' }).getAttribute('aria-labelledby')).toBe(heading.id);
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Panel title="Operations">body</Panel>);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Segmented', () => {
  it('is a labelled group of toggle buttons', () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Result"
        value="all"
        onChange={onChange}
        options={[
          { id: 'all', label: 'All', count: 12 },
          { id: 'failed', label: 'Failed', count: 3 },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Result' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^All\s*,\s*12$/ }).getAttribute('aria-pressed')).toBe('true');
    const failed = screen.getByRole('button', { name: /^Failed\s*,\s*3$/ });
    expect(failed.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(failed);
    expect(onChange).toHaveBeenCalledWith('failed');
  });

  it('keeps dots and icons decorative', () => {
    const { container } = render(
      <Segmented label="View" value="table" onChange={() => {}} variant="joined" options={[{ id: 'table', label: 'Table', icon: 'list', dot: 'success' }]} />,
    );
    expect(screen.getByRole('button', { name: 'Table' })).toBeTruthy();
    expect(container.querySelector('.segmented')?.getAttribute('data-variant')).toBe('joined');
    expect(container.querySelector('.segmented-dot')?.getAttribute('aria-hidden')).toBe('true');
  });
});
