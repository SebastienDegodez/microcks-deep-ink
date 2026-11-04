import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { ResultBox } from './result-box';

describe('ResultBox', () => {
  it('is a status box with a decorative icon, an action and a named dismiss button', async () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <div>
        <ResultBox size="md" onDismiss={onDismiss}>Secret gitlab-bakery created.</ResultBox>
        <ResultBox tone="neutral" title="checkout-beer cannot run" action={<button type="button">Link source</button>}>
          Import the Beer Catalog first.
        </ResultBox>
        <ResultBox tone="info" live="off">Static note</ResultBox>
      </div>,
    );
    const boxes = screen.getAllByRole('status');
    expect(boxes).toHaveLength(2);
    expect(boxes[0]!.querySelector('.result-box-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(boxes[1]!.getAttribute('data-tone')).toBe('neutral');
    expect(screen.getByText('checkout-beer cannot run').className).toBe('result-box-title');
    expect(screen.getByRole('button', { name: 'Link source' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByText('Static note').closest('.result-box')?.querySelector('.result-box-icon')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});
