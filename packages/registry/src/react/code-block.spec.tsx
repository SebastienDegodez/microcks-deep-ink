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
});
