import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { TabPanel, Tabs } from './tabs';
import type { TabItem } from './tabs';

const items: TabItem[] = [
  { id: 'ops', label: 'Operations', count: 4 },
  { id: 'props', label: 'Properties' },
  { id: 'off', label: 'Archived', disabled: true },
  { id: 'tests', label: 'Tests' },
];

function Harness({ activation, onChange }: { activation?: 'automatic' | 'manual'; onChange?: (id: string) => void }) {
  const [value, setValue] = useState('ops');
  return (
    <Tabs
      label="Service sections"
      items={items}
      value={value}
      activation={activation}
      onChange={(id) => {
        onChange?.(id);
        setValue(id);
      }}
    >
      {items.map((t) => (
        <TabPanel key={t.id} id={t.id} value={value}>
          Content of {t.label}
        </TabPanel>
      ))}
    </Tabs>
  );
}

const OPS = /^Operations\s*,\s*4$/;
const tab = (name: string | RegExp) => screen.getByRole('tab', { name });

describe('Tabs', () => {
  it('exposes tablist, selected state and panel wiring', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Service sections' })).toBeTruthy();
    expect(tab(OPS).getAttribute('aria-selected')).toBe('true');
    expect(tab('Properties').getAttribute('aria-selected')).toBe('false');
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab(OPS).id);
    expect(tab(OPS).getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.textContent).toBe('Content of Operations');
  });

  it('uses a roving tabindex', () => {
    render(<Harness />);
    expect(tab(OPS).tabIndex).toBe(0);
    expect(tab('Properties').tabIndex).toBe(-1);
    expect(tab('Tests').tabIndex).toBe(-1);
  });

  it('moves with the arrow keys, skips disabled tabs and wraps', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(tab(OPS), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('props');
    expect(document.activeElement).toBe(tab('Properties'));
    fireEvent.keyDown(tab('Properties'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('tests');
    fireEvent.keyDown(tab('Tests'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('ops');
    fireEvent.keyDown(tab(OPS), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('tests');
    expect(tab('Tests').getAttribute('aria-selected')).toBe('true');
  });

  it('jumps with Home and End', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(tab(OPS), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('tests');
    fireEvent.keyDown(tab('Tests'), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('ops');
    expect(document.activeElement).toBe(tab(OPS));
  });

  it('manual activation moves focus without selecting', () => {
    const onChange = vi.fn();
    render(<Harness activation="manual" onChange={onChange} />);
    fireEvent.keyDown(tab(OPS), { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tab('Properties'));
    expect(tab(OPS).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tab('Properties'));
    expect(onChange).toHaveBeenCalledWith('props');
  });

  it('renders only the selected panel content', () => {
    render(<Harness />);
    fireEvent.click(tab('Tests'));
    expect(screen.getByRole('tabpanel').textContent).toBe('Content of Tests');
    expect(document.querySelectorAll('[role="tabpanel"][hidden]').length).toBe(3);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Tabs icon and hint', () => {
  it('puts a hidden icon before the label and reads the hint after a comma', async () => {
    const { container } = render(
      <Tabs
        label="Source type"
        variant="card"
        value="file"
        onChange={() => {}}
        items={[{ id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' }, { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' }]}
      >
        <TabPanel id="file" value="file">File</TabPanel>
        <TabPanel id="git" value="file">Git</TabPanel>
      </Tabs>,
    );
    const t = screen.getByRole('tab', { name: 'Upload, one-off file' });
    expect(t.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(t.querySelector('svg')?.getAttribute('width')).toBe('16');
    expect(container.querySelector('.tabs')?.getAttribute('data-variant')).toBe('card');
    expect(await axeViolations(container)).toEqual([]);
  });
});
