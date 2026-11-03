import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Button, ButtonLink } from './button';

describe('Button', () => {
  it('is a native button of type button with variant hooks', () => {
    render(<Button variant="primary">Run test</Button>);
    const b = screen.getByRole('button', { name: 'Run test' });
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('di-button');
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
    expect(ref.current?.className).toBe('di-button mine');
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
    expect(link.className).toContain('di-button');
    expect(link.getAttribute('data-variant')).toBe('primary');
  });

  it('ButtonLink renders an anchor', () => {
    render(<ButtonLink href="/x">Go</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Go' }).className).toContain('di-button');
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
