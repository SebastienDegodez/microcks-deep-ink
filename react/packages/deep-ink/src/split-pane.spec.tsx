import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { SplitPane, SplitPaneMain, SplitPaneSide } from './split-pane';

describe('SplitPane', () => {
  it('keeps the panes in DOM order with their landmarks and sets the width variables', async () => {
    const { container } = render(
      <main>
        <SplitPane sideWidth="300px" sideMax="380px" align="stretch" balanced>
          <SplitPaneSide as="nav" aria-label="Operations">list</SplitPaneSide>
          <SplitPaneMain as="section" aria-label="Operation detail">detail</SplitPaneMain>
        </SplitPane>
      </main>,
    );
    const root = container.querySelector('.split-pane') as HTMLElement;
    expect(root.style.getPropertyValue('--split-side')).toBe('300px');
    expect(root.style.getPropertyValue('--split-side-max')).toBe('380px');
    expect(root.getAttribute('data-align')).toBe('stretch');
    expect(root.hasAttribute('data-balanced')).toBe(true);
    const nav = screen.getByRole('navigation', { name: 'Operations' });
    expect(nav.className).toBe('split-pane-side');
    expect(nav.nextElementSibling).toBe(screen.getByRole('region', { name: 'Operation detail' }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
