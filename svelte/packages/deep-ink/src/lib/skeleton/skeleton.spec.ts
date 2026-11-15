import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Skeleton from './Skeleton.svelte';

describe('Skeleton', () => {
  it('is hidden from assistive technology', async () => {
    const { container } = render(Skeleton, { props: { lines: 3 } });
    const group = container.firstElementChild as HTMLElement;
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.children).toHaveLength(3);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('cannot be shown to assistive technology by an attribute', () => {
    const { container } = render(Skeleton, { props: { 'aria-hidden': 'false', title: 'Loading' } });
    const block = container.firstElementChild as HTMLElement;
    expect(block.getAttribute('aria-hidden')).toBe('true');
    expect(block.title).toBe('Loading');
  });

  it('renders one block by default', () => {
    const { container } = render(Skeleton);
    const block = container.firstElementChild as HTMLElement;
    expect(block.localName).toBe('span');
    expect(block.children).toHaveLength(0);
  });

  it('sets the width in px for a number and as is for a string, before the given style', () => {
    const { container, rerender } = render(Skeleton, { props: { width: 120 } });
    const block = () => container.firstElementChild as HTMLElement;
    expect(block().style.getPropertyValue('--skeleton-width')).toBe('120px');
    rerender({ lines: 2, width: '70%', style: 'margin: 4px' });
    expect(block().style.getPropertyValue('--skeleton-width')).toBe('70%');
    expect(block().style.margin).toBe('4px');
  });
});
