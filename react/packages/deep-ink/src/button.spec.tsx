import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { Button, ButtonLink } from './button';

describe('Button', () => {
  it('is a native button of type button with variant hooks', () => {
    render(<Button variant="primary">Run test</Button>);
    const b = screen.getByRole('button', { name: 'Run test' });
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('button');
    expect(b.getAttribute('data-variant')).toBe('primary');
    expect(b.getAttribute('data-size')).toBe('md');
  });

  it('merges className, forwards props and the ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    const onClick = vi.fn();
    render(
      <Button ref={ref} className="mine" onClick={onClick} type="submit">
        Go
      </Button>,
    );
    expect(ref.current?.className).toBe('button mine');
    expect(ref.current?.type).toBe('submit');
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('loading sets aria-busy and disables', () => {
    render(<Button loading>Import</Button>);
    const b = screen.getByRole('button', { name: 'Import' }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
  });

  it('icon-only requires an accessible name', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Button iconOnly icon="close" aria-label="Close" />);
    expect(screen.getByRole('button', { name: 'Close' }).getAttribute('data-icon-only')).toBe('');
    expect(error).not.toHaveBeenCalled();
    render(<Button iconOnly icon="trash" />);
    expect(error).toHaveBeenCalledOnce();
  });

  it('asChild styles the child element', () => {
    render(
      <Button asChild variant="primary">
        <a href="/services">Open</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link.className).toContain('button');
    expect(link.getAttribute('data-variant')).toBe('primary');
  });

  it('ButtonLink renders an anchor', () => {
    render(<ButtonLink href="/x">Go</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Go' }).className).toContain('button');
  });

  it('exposes the outline variant, the compact and large sizes and the danger tone', () => {
    render(
      <div>
        <Button variant="outline" size="lg">Cancel</Button>
        <Button variant="dashed" size="compact" icon="plus">Add header</Button>
        <Button variant="ghost" size="sm" tone="danger">Delete</Button>
      </div>,
    );
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel.getAttribute('data-variant')).toBe('outline');
    expect(cancel.getAttribute('data-size')).toBe('lg');
    expect(screen.getByRole('button', { name: 'Add header' }).querySelector('svg')?.getAttribute('width')).toBe('14');
    expect(screen.getByRole('button', { name: 'Delete' }).getAttribute('data-tone')).toBe('danger');
  });

  it('has a 36px tile size for card footers, with a 14px icon', () => {
    render(<Button variant="primary" size="tile" icon="download">Install</Button>);
    const install = screen.getByRole('button', { name: 'Install' });
    expect(install.getAttribute('data-size')).toBe('tile');
    expect(install.querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('has a 28px xs size with a 14px icon and a link tone for the outline variant', async () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const { container } = render(<Button ref={ref} variant="outline" size="xs" tone="link" icon="refresh" onClick={onClick}>Undo</Button>);
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(ref.current).toBe(undo);
    expect(undo.getAttribute('type')).toBe('button');
    expect(undo.getAttribute('data-variant')).toBe('outline');
    expect(undo.getAttribute('data-size')).toBe('xs');
    expect(undo.getAttribute('data-tone')).toBe('link');
    expect(undo.querySelector('svg')?.getAttribute('width')).toBe('14');
    fireEvent.click(undo);
    expect(onClick).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Save</Button>
        <Button iconOnly icon="close" aria-label="Close" />
        <ButtonLink href="/x">Open</ButtonLink>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
