import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is one hidden bar with an optional width variable', () => {
    const { container } = render(<Skeleton width={120} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toBe('skeleton');
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.style.getPropertyValue('--skeleton-width')).toBe('120px');
  });

  it('renders a hidden group of lines', () => {
    const { container } = render(<Skeleton lines={3} width="50%" />);
    const group = container.firstElementChild as HTMLElement;
    expect(group.className).toBe('skeleton-group');
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.querySelectorAll('.skeleton')).toHaveLength(3);
    expect(group.style.getPropertyValue('--skeleton-width')).toBe('50%');
  });
});
