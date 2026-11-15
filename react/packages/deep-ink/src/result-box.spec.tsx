import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
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
    for (const box of boxes) {
      expect(box.hasAttribute('data-bordered')).toBe(false);
      expect(box.hasAttribute('data-surface')).toBe(false);
      expect(box.hasAttribute('data-density')).toBe(false);
    }
  });

  it('bordered={false} and surface="raised" expose the flat raised note layout', async () => {
    const { container } = render(
      <ResultBox tone="danger" icon="cross" title="The agent answered a canceled task" bordered={false} surface="raised" live="off">
        A canceled task must stay terminal.
      </ResultBox>,
    );
    const box = container.querySelector('.result-box')!;
    expect(box.getAttribute('data-bordered')).toBe('false');
    expect(box.getAttribute('data-surface')).toBe('raised');
    expect(box.getAttribute('role')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('density="compact" keeps the status role, the text and the action (Sources undo banner)', async () => {
    const onUndo = vi.fn();
    const { container } = render(
      <ResultBox tone="info" density="compact" action={<button type="button" onClick={onUndo}>Undo</button>}>
        <strong>Pastry orders events</strong> deleted.
      </ResultBox>,
    );
    const box = screen.getByRole('status');
    expect(box.getAttribute('data-density')).toBe('compact');
    expect(box.getAttribute('data-tone')).toBe('info');
    expect(box.querySelector('.result-box-icon')).toBeNull();
    expect(box.textContent).toBe('Pastry orders events deleted.Undo');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });
});
