import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { CodeBlock } from './code-block';
import { LiveIndicator } from './live-indicator';

describe('CodeBlock', () => {
  it('switches format with toggle buttons in the header', async () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <CodeBlock code="curl …" tabs={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }]} tab="curl" onTabChange={onTabChange} />,
    );
    expect(screen.getByRole('group', { name: 'Format' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'curl', pressed: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'HTTPie', pressed: false }));
    expect(onTabChange).toHaveBeenCalledWith('httpie');
    expect(screen.getByRole('region', { name: 'curl code' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no header in the plain variant', () => {
    const { container } = render(<CodeBlock variant="plain" caption="Stored as" code="{}" />);
    expect(container.querySelector('figcaption')).toBeNull();
    expect(screen.getByRole('region', { name: 'Stored as' })).toBeTruthy();
  });

  it('numbers lines and writes the note on the bad line', () => {
    const { container } = render(<CodeBlock variant="plain" lineNumbers startLine={10} lines={[{ text: 'a' }, { text: 'b', bad: true, note: 'schema: number' }]} />);
    const nums = Array.from(container.querySelectorAll('.code-ln')).map((n) => n.textContent);
    expect(nums).toEqual(['10', '11']);
    expect(container.querySelectorAll('.code-line')[1]!.textContent).toContain('schema: number');
  });

  it('names the region with label, keeping the caption visible', () => {
    render(<CodeBlock caption="SendMessage · curl" label="SendMessage · curl, JSON-RPC binding" code="curl -X POST" />);
    expect(screen.getByRole('region', { name: 'SendMessage · curl, JSON-RPC binding' })).toBeTruthy();
    expect(screen.getByText('SendMessage · curl')).toBeTruthy();
  });

  it('narrow gutter, danger frame and an 11px cross on the bad line', () => {
    const { container } = render(
      <CodeBlock variant="plain" caption="Response body" lineNumbers gutter="narrow" tone="danger" lines={[{ text: '{' }, { text: '  "price": "2.5"', bad: true, note: 'schema: number' }]} />,
    );
    const fig = container.querySelector('figure')!;
    expect(fig.getAttribute('data-gutter')).toBe('narrow');
    expect(fig.getAttribute('data-tone')).toBe('danger');
    const bad = container.querySelectorAll('.code-line')[1]!;
    expect(bad.querySelector('.code-mark svg')?.getAttribute('width')).toBe('11');
    expect(bad.textContent).toContain('Problem: ');
  });
});

describe('LiveIndicator', () => {
  it('writes a custom paused label and swaps the dot for a glyph', () => {
    const { container } = render(<LiveIndicator paused pausedLabel="paused · 2 new calls" />);
    expect(container.textContent).toBe('paused · 2 new calls');
    expect(container.querySelector('.live-dot')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes "paused" after the label by default', () => {
    const { container } = render(<LiveIndicator paused size="sm" />);
    expect(container.textContent).toBe('live · paused');
    expect(container.querySelector('.live')?.getAttribute('data-size')).toBe('sm');
  });

  it('dot: keeps the dot and moves the label into a visually hidden span', () => {
    const { container } = render(<LiveIndicator variant="dot" label="live task" />);
    const live = container.querySelector('.live')!;
    expect(live.getAttribute('data-variant')).toBe('dot');
    expect(live.querySelector('.live-dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(live.querySelector('.sr-only')?.textContent).toBe('live task');
    expect(live.textContent).toBe('live task');
  });
});

describe('CodeBlock changed lines', () => {
  it('writes a visible + and a hidden "Changed: " on changed lines, and keeps the column on the others', async () => {
    const { container } = render(
      <CodeBlock caption="contract-tests.yml" lines={[{ text: 'jobs:' }, { text: '  - name: Contract test API Pastry 2.0', changed: true }]} />,
    );
    const figure = container.querySelector('figure')!;
    expect(figure.hasAttribute('data-diff')).toBe(true);
    const [plain, changed] = Array.from(container.querySelectorAll('.code-line'));
    expect(plain!.querySelector('.code-mark')?.textContent).toBe('');
    expect(changed!.hasAttribute('data-changed')).toBe(true);
    expect(changed!.querySelector('.code-mark')?.textContent).toBe('+');
    expect(changed!.querySelector('.code-mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(changed!.textContent).toBe('+Changed:   - name: Contract test API Pastry 2.0');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no mark column without changed lines', () => {
    const { container } = render(<CodeBlock lines={[{ text: 'a' }, { text: 'b', selected: true }]} />);
    expect(container.querySelector('figure')!.hasAttribute('data-diff')).toBe(false);
    expect(container.querySelector('.code-mark')).toBeNull();
  });
});
