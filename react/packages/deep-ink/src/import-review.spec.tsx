import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DropZone } from './drop-zone';
import { Input } from './input';
import { MethodTag } from './method-tag';

describe('Import review options', () => {
  it('input on the page background, method tag with a fixed min width', () => {
    render(
      <div>
        <label htmlFor="u">URL</label>
        <Input id="u" surface="bg" />
        <MethodTag method="GET" minWidth={52} />
      </div>,
    );
    expect(screen.getByRole('textbox', { name: 'URL' }).getAttribute('data-surface')).toBe('bg');
    expect(screen.getByText('GET').style.getPropertyValue('--method-min-width')).toBe('52px');
  });

  it('method tag small size', () => {
    render(<MethodTag method="PATCH" size="sm" />);
    expect(screen.getByText('PATCH').getAttribute('data-size')).toBe('sm');
    render(<MethodTag method="DELETE" size="xs" />);
    expect(screen.getByText('DELETE').getAttribute('data-size')).toBe('xs');
  });

  it('keeps the empty drop-zone status as a live region, flagged empty', () => {
    render(<DropZone heading="Drop a contract" hint="OpenAPI, AsyncAPI" onFiles={() => {}} />);
    const status = screen.getByRole('status');
    expect(status.hasAttribute('data-empty')).toBe(true);
    expect(status.classList.contains('sr-only')).toBe(true);
  });
});
