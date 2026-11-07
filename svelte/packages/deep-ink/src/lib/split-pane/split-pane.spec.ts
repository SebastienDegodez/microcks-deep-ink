import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SplitPaneHarness from '../../../test/fixtures/SplitPaneHarness.svelte';
import SplitPane from './SplitPane.svelte';

describe('SplitPane', () => {
  it('keeps the panes in DOM order with their landmarks and sets the width variables', async () => {
    const { container } = render(SplitPaneHarness, { props: { sideWidth: '300px', sideMax: '380px', align: 'stretch', balanced: true } });
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

  it('keeps the side cap on narrow screens with keepSideMax, without changing roles or names', async () => {
    const { container } = render(SplitPaneHarness, { props: { sideWidth: '360px', sideMax: '360px', keepSideMax: true } });
    const root = container.querySelector('.split-pane') as HTMLElement;
    expect(root.hasAttribute('data-keep-side-max')).toBe(true);
    expect(screen.getByRole('navigation', { name: 'Operations' }).className).toBe('split-pane-side');
    expect(screen.getByRole('region', { name: 'Operation detail' }).className).toBe('split-pane-main');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('lets the side pane fill the row on narrow screens by default', () => {
    const { container } = render(SplitPane, { props: { children: createRawSnippet(() => ({ render: () => '<div>panes</div>' })) } });
    expect((container.querySelector('.split-pane') as HTMLElement).hasAttribute('data-keep-side-max')).toBe(false);
  });

  it('sets the main width and gap, and the style string wins over them', () => {
    const { container } = render(SplitPane, { props: { mainWidth: '600px', gap: '24px', style: '--split-gap: 8px; color: red' } });
    const root = container.querySelector('.split-pane') as HTMLElement;
    expect([root.style.getPropertyValue('--split-main'), root.style.getPropertyValue('--split-gap'), root.style.color]).toEqual(['600px', '8px', 'red']);
  });
});
