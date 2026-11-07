import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import LiveIndicator from './LiveIndicator.svelte';

describe('LiveIndicator', () => {
  it('writes "live" next to a decorative dot, and is not a live region', async () => {
    const { container } = render(LiveIndicator);
    const live = container.querySelector<HTMLElement>('.live')!;
    expect(live.textContent).toBe('live');
    expect([live.dataset.size, live.dataset.variant, live.hasAttribute('data-paused'), live.getAttribute('role')]).toEqual(['md', 'pill', false, null]);
    expect(live.querySelector('.live-dot')!.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('writes "paused" with a pause glyph instead of the dot, or the paused label', async () => {
    const { container, rerender } = render(LiveIndicator, { props: { label: 'streaming', paused: true } });
    const live = container.querySelector<HTMLElement>('.live')!;
    expect([live.textContent, live.hasAttribute('data-paused'), live.querySelector('.live-dot'), live.querySelector('svg')?.getAttribute('aria-hidden')]).toEqual(['streaming · paused', true, null, 'true']);
    await rerender({ pausedLabel: 'paused · 2 new calls' });
    expect(live.textContent).toBe('paused · 2 new calls');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('keeps the label read but visually hidden in the dot variant', async () => {
    const { container } = render(LiveIndicator, { props: { variant: 'dot', size: 'sm', label: 'live task' } });
    expect(container.querySelector('.live .sr-only')!.textContent).toBe('live task');
    expect(container.querySelector<HTMLElement>('.live')!.dataset.size).toBe('sm');
    expect(await axeViolations(container)).toEqual([]);
  });
});
