import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SplitPaneHarness from '../../../test/fixtures/SplitPaneHarness.svelte';
describe('SplitPane', () => {
  it('keeps DOM reading order and landmarks and sets width variables', async () => {
    const {container}=render(SplitPaneHarness,{sideWidth:'300px',sideMax:'380px',mainWidth:'540px',gap:'24px',align:'stretch',balanced:true});
    const root=container.querySelector<HTMLElement>('.split-pane')!;
    expect(root.style.getPropertyValue('--split-side')).toBe('300px');
    expect(root.style.getPropertyValue('--split-side-max')).toBe('380px');
    expect(root.style.getPropertyValue('--split-main')).toBe('540px');
    expect(root.style.getPropertyValue('--split-gap')).toBe('24px');
    expect(root.getAttribute('data-align')).toBe('stretch');
    expect(root.hasAttribute('data-balanced')).toBe(true);
    const nav=screen.getByRole('navigation',{name:'Operations'});
    expect(nav.className).toBe('split-pane-side');
    expect(nav.nextElementSibling).toBe(screen.getByRole('region',{name:'Operation detail'}));
    expect(await axeViolations(container)).toEqual([]);
  });
  it('keeps the side cap on narrow screens without changing names', async () => {
    const {container}=render(SplitPaneHarness,{sideWidth:'360px',sideMax:'360px',keepSideMax:true});
    expect(container.querySelector('.split-pane')?.hasAttribute('data-keep-side-max')).toBe(true);
    expect(screen.getByRole('navigation',{name:'Operations'}).className).toBe('split-pane-side');
    expect(screen.getByRole('region',{name:'Operation detail'}).className).toBe('split-pane-main');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('fills narrow rows by default and lets user styles override variables', () => {
    const {container}=render(SplitPaneHarness,{sideWidth:'300px',style:'--split-side:320px;color:red'});
    const root=container.querySelector<HTMLElement>('.split-pane')!;
    expect(root.hasAttribute('data-keep-side-max')).toBe(false);
    expect(root.style.getPropertyValue('--split-side')).toBe('320px');
    expect(root.style.color).toBe('red');
  });
});
