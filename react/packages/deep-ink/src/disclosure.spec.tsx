import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { Disclosure } from './disclosure';

describe('Disclosure', () => {
  it('is a native <details> closed by default, opened by its summary', async () => {
    const { container } = render(<Disclosure summary="Headers">Body</Disclosure>);
    const details = container.querySelector('details')!;
    expect(details.className).toBe('disclosure');
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText('Headers'));
    expect(details.open).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('starts open with defaultOpen', () => {
    const { container } = render(<Disclosure summary="Headers" defaultOpen>Body</Disclosure>);
    expect(container.querySelector('details')!.open).toBe(true);
  });
});
