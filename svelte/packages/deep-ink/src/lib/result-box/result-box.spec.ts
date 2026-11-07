import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ResultBox from './ResultBox.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('ResultBox', () => {
  it('is a status box with a decorative icon, an action and a named dismiss button', async () => {
    const onDismiss = vi.fn();
    const { container } = render(ResultBox, { props: { size: 'md', onDismiss, children: text('Secret gitlab-bakery created.') } });
    const action = createRawSnippet(() => ({ render: () => '<button type="button">Link source</button>' }));
    render(ResultBox, { target: container, props: { tone: 'neutral', title: 'checkout-beer cannot run', action, children: text('Import the Beer Catalog first.') } });
    render(ResultBox, { target: container, props: { tone: 'info', live: 'off', children: text('Static note') } });
    const boxes = screen.getAllByRole('status');
    expect(boxes).toHaveLength(2);
    expect(boxes[0]!.querySelector('.result-box-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(boxes[1]!.getAttribute('data-tone')).toBe('neutral');
    expect(screen.getByText('checkout-beer cannot run').className).toBe('result-box-title');
    expect(screen.getByRole('button', { name: 'Link source' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByText('Static note').closest('.result-box')?.querySelector('.result-box-icon')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
    for (const box of boxes) {
      expect(box.hasAttribute('data-bordered')).toBe(false);
      expect(box.hasAttribute('data-surface')).toBe(false);
    }
  });

  it('bordered={false} and surface="raised" expose the flat raised note layout', async () => {
    const { container } = render(ResultBox, {
      props: { tone: 'danger', icon: 'cross', title: 'The agent answered a canceled task', bordered: false, surface: 'raised', live: 'off', children: text('A canceled task must stay terminal.') },
    });
    const box = container.querySelector('.result-box')!;
    expect(box.getAttribute('data-bordered')).toBe('false');
    expect(box.getAttribute('data-surface')).toBe('raised');
    expect(box.getAttribute('role')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});
