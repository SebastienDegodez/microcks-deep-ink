import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import CodeBlock from './CodeBlock.svelte';

describe('CodeBlock', () => {
  it('switches format with toggle buttons in the header', async () => {
    const ontabchange = vi.fn();
    const { container } = render(CodeBlock, {
      props: { code: 'curl …', tabs: [{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }], tab: 'curl', ontabchange },
    });
    expect(screen.getByRole('group', { name: 'Format' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'curl', pressed: true })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'HTTPie', pressed: false }));
    expect(ontabchange).toHaveBeenCalledWith('httpie');
    expect(screen.getByRole('region', { name: 'curl code' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no header in the plain variant', () => {
    const { container } = render(CodeBlock, { props: { variant: 'plain', caption: 'Stored as', code: '{}' } });
    expect(container.querySelector('figcaption')).toBeNull();
    expect(screen.getByRole('region', { name: 'Stored as' })).toBeTruthy();
  });

  it('leaves no layout whitespace around its header and its code, as the twin', () => {
    const plain = render(CodeBlock, { props: { variant: 'plain', caption: 'Stored as', code: '{}' } });
    expect(plain.container.querySelector('figure')?.textContent).toBe('{}');
    plain.unmount();
    const { container } = render(CodeBlock, { props: { caption: 'Request', code: 'GET /pastries', copy: false } });
    expect(container.querySelector('figure')?.textContent).toBe('RequestGET /pastries');
  });

  it('numbers lines and writes the note on the bad line', () => {
    const { container } = render(CodeBlock, { props: { variant: 'plain', lineNumbers: true, startLine: 10, lines: [{ text: 'a' }, { text: 'b', bad: true, note: 'schema: number' }] } });
    const nums = Array.from(container.querySelectorAll('.code-ln')).map((n) => n.textContent);
    expect(nums).toEqual(['10', '11']);
    expect(container.querySelectorAll('.code-line')[1]!.textContent).toContain('schema: number');
  });

  it('names the region with label, keeping the caption visible', () => {
    render(CodeBlock, { props: { caption: 'SendMessage · curl', label: 'SendMessage · curl, JSON-RPC binding', code: 'curl -X POST' } });
    expect(screen.getByRole('region', { name: 'SendMessage · curl, JSON-RPC binding' })).toBeTruthy();
    expect(screen.getByText('SendMessage · curl')).toBeTruthy();
  });

  it('narrow gutter, danger frame and an 11px cross on the bad line', () => {
    const { container } = render(CodeBlock, {
      props: { variant: 'plain', caption: 'Response body', lineNumbers: true, gutter: 'narrow', tone: 'danger', lines: [{ text: '{' }, { text: '  "price": "2.5"', bad: true, note: 'schema: number' }] },
    });
    const fig = container.querySelector('figure')!;
    expect(fig.getAttribute('data-gutter')).toBe('narrow');
    expect(fig.getAttribute('data-tone')).toBe('danger');
    const bad = container.querySelectorAll('.code-line')[1]!;
    expect(bad.querySelector('.code-mark svg')?.getAttribute('width')).toBe('11');
    expect(bad.textContent).toContain('Problem: ');
  });

  it('copies the code and announces it in a polite live region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(CodeBlock, { props: { caption: 'Body', lines: [{ text: 'a' }, { text: 'b' }] } });
    await fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('a\nb');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });
});

describe('CodeBlock changed lines', () => {
  it('writes a visible + and a hidden "Changed: " on changed lines, and keeps the column on the others', async () => {
    const { container } = render(CodeBlock, { props: { caption: 'contract-tests.yml', lines: [{ text: 'jobs:' }, { text: '  - name: Contract test API Pastry 2.0', changed: true }] } });
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
    const { container } = render(CodeBlock, { props: { lines: [{ text: 'a' }, { text: 'b', selected: true }] } });
    expect(container.querySelector('figure')!.hasAttribute('data-diff')).toBe(false);
    expect(container.querySelector('.code-mark')).toBeNull();
  });
});

describe('CodeBlock bare, source and raised header', () => {
  it('writes the source next to the caption in a raised header, keeping the region name', async () => {
    const { container } = render(CodeBlock, { props: { caption: 'Expected', source: 'Pastry.json', headerTone: 'raised', copy: false, code: '{"price": "number"}' } });
    const figure = container.querySelector('figure')!;
    expect(figure.getAttribute('data-header-tone')).toBe('raised');
    expect(screen.getByText('Expected').hasAttribute('data-title')).toBe(true);
    expect(screen.getByText('Pastry.json')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Expected' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no header in the bare variant and keeps the named region by default', async () => {
    const { container } = render(CodeBlock, { props: { variant: 'bare', caption: 'Response', source: 'Pastry.json', code: '{}' } });
    expect(container.querySelector('figure')!.getAttribute('data-variant')).toBe('bare');
    expect(container.querySelector('figcaption')).toBeNull();
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
    expect(screen.getByRole('region', { name: 'Response' }).getAttribute('tabindex')).toBe('0');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('focusable="overflow": not a region while the code fits', async () => {
    const { container } = render(CodeBlock, { props: { variant: 'bare', caption: 'Response', focusable: 'overflow', code: '{}' } });
    expect(screen.queryByRole('region')).toBeNull();
    const pre = container.querySelector('pre')!;
    expect(pre.hasAttribute('tabindex')).toBe(false);
    expect(pre.hasAttribute('aria-label')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('focusable="overflow": a focusable named region when the code scrolls', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const { container } = render(CodeBlock, { props: { caption: 'Long line', focusable: 'overflow', copy: false, code: 'curl -X PATCH http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille' } });
    const region = screen.getByRole('region', { name: 'Long line' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('focusable="overflow": remeasures when a note makes the same text overflow', async () => {
    // Width follows the rendered text (notes included), the box stays 300px wide.
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return (this.textContent ?? '').length * 8;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const props = { variant: 'bare', caption: 'Body', focusable: 'overflow' } as const;
    const { rerender } = render(CodeBlock, { props: { ...props, lines: [{ text: '{}' }] } });
    expect(screen.queryByRole('region')).toBeNull();
    await rerender({ ...props, lines: [{ text: '{}', note: 'x'.repeat(100) }] });
    expect(screen.getByRole('region', { name: 'Body' }).getAttribute('tabindex')).toBe('0');
    await rerender({ ...props, lines: [{ text: '{}' }] });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('focusable="overflow": remeasures when the box is resized (ResizeObserver), and disconnects on unmount', () => {
    const observers: { cb: () => void; observed: Element[]; disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observed: Element[] = [];
        disconnect = vi.fn();
        constructor(public cb: () => void) {
          observers.push(this);
        }
        observe(el: Element) {
          this.observed.push(el);
        }
      },
    );
    let width = 300;
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    try {
      const { container, unmount } = render(CodeBlock, { props: { frame: 'none', focusable: 'overflow', label: 'Config', code: 'x'.repeat(60) } });
      const pre = container.querySelector('pre')!;
      expect(observers).toHaveLength(1);
      expect(observers[0]!.observed).toEqual([pre]);
      expect(screen.getByRole('region', { name: 'Config' })).toBe(pre);
      width = 600;
      flushSync(() => observers[0]!.cb());
      expect(screen.queryByRole('region')).toBeNull();
      width = 300;
      flushSync(() => observers[0]!.cb());
      expect(screen.getByRole('region', { name: 'Config' }).getAttribute('tabindex')).toBe('0');
      unmount();
      expect(observers[0]!.disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('observes nothing unless focusable="overflow"', () => {
    const observe = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe = observe; disconnect() {} });
    try {
      render(CodeBlock, { props: { code: '{}' } });
      render(CodeBlock, { props: { code: '{}', focusable: 'never' } });
      expect(observe).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('CodeBlock frame="none" (pre only)', () => {
  it('renders only the pre, no figure, header or copy; always a named region by default', async () => {
    const { container } = render(CodeBlock, { props: { frame: 'none', variant: 'bare', caption: 'Schema', label: 'Input schema of getPastry', class: 'tool-card-schema', code: '{"type": "object"}' } });
    expect(container.querySelector('figure')).toBeNull();
    expect(container.querySelector('figcaption')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    const pre = container.firstElementChild!;
    expect(pre.tagName).toBe('PRE');
    expect(pre.className).toBe('code-pre tool-card-schema');
    expect(pre.getAttribute('data-variant')).toBe('bare');
    const region = screen.getByRole('region', { name: 'Input schema of getPastry' });
    expect(region).toBe(pre);
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('focusable="never": a plain pre, not focusable nor named', async () => {
    const { container } = render(CodeBlock, { props: { frame: 'none', focusable: 'never', label: 'Config', code: '{}' } });
    const pre = container.querySelector('pre')!;
    expect(screen.queryByRole('region')).toBeNull();
    expect(pre.hasAttribute('tabindex')).toBe(false);
    expect(pre.hasAttribute('role')).toBe(false);
    expect(pre.hasAttribute('aria-label')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('focusable="overflow": plain while it fits, a named region when it scrolls', async () => {
    const { container, unmount } = render(CodeBlock, { props: { frame: 'none', focusable: 'overflow', label: 'Config', code: '{}' } });
    expect(container.querySelector('figure')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('pre')!.hasAttribute('tabindex')).toBe(false);
    unmount();
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const r = render(CodeBlock, { props: { frame: 'none', focusable: 'overflow', label: 'Config', code: 'x'.repeat(200) } });
    expect(screen.getByRole('region', { name: 'Config' }).getAttribute('tabindex')).toBe('0');
    expect(await axeViolations(r.container)).toEqual([]);
  });

  it('keeps the data hooks, line markup and max height on the pre', () => {
    const { container } = render(CodeBlock, {
      props: { frame: 'none', variant: 'plain', tone: 'danger', lineNumbers: true, gutter: 'narrow', maxHeight: 120, style: 'margin-top: 4px', lines: [{ text: 'a' }, { text: 'b', bad: true, note: 'schema: number' }] },
    });
    const pre = container.querySelector('pre')!;
    expect(pre.getAttribute('data-numbered')).toBe('');
    expect(pre.getAttribute('data-gutter')).toBe('narrow');
    expect(pre.getAttribute('data-tone')).toBe('danger');
    expect(pre.style.maxHeight).toBe('120px');
    expect(pre.style.marginTop).toBe('4px');
    expect(container.querySelectorAll('.code-ln')).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Code' })).toBe(pre);
  });

  it('focusable="never" also applies in the default figure', () => {
    const { container } = render(CodeBlock, { props: { variant: 'plain', focusable: 'never', caption: 'Stored as', code: '{}' } });
    expect(container.querySelector('figure')).not.toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });
});
