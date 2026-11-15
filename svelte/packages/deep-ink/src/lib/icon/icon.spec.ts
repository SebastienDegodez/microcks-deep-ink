import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import { ICON_NAMES } from './icon';
import Icon from './Icon.svelte';

describe('Icon', () => {
  it('is decorative by default', async () => {
    const { container } = render(Icon, { props: { name: 'check' } });
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(screen.queryByRole('img')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is an image when it has a label', async () => {
    const { container } = render(Icon, { props: { name: 'check', label: 'Passed', size: 20 } });
    const svg = screen.getByRole('img', { name: 'Passed' });
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.getAttribute('width')).toBe('20');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('ships the names required by the contract', () => {
    for (const n of ['spark', 'retry', 'end', 'branch', 'link-out', 'play', 'pause', 'pause-narrow', 'trash', 'trash-plain', 'undo', 'check', 'cross', 'dash', 'warning', 'info', 'external', 'chevron-down', 'menu', 'search', 'close', 'copy', 'upload', 'tests', 'sun', 'moon', 'download', 'check-circle', 'x-circle', 'never-tested', 'more-vertical', 'arrow-right', 'chevron-left', 'list', 'badge-wall', 'reset', 'replay', 'skip', 'pencil', 'clock', 'early-end', 'lens']) {
      expect(ICON_NAMES).toContain(n);
    }
  });

  it('draws the prototype paths', () => {
    const { container } = render(Icon, { props: { name: 'check' } });
    expect(container.querySelector('path')!.getAttribute('d')).toBe('M5 12l5 5 9-11');
  });

  it('dashes the ring of "never tested"', () => {
    const { container } = render(Icon, { props: { name: 'never-tested' } });
    const [ring, bar] = Array.from(container.querySelectorAll('path'));
    expect(ring!.getAttribute('stroke-dasharray')).toBe('3 3');
    expect(bar!.hasAttribute('stroke-dasharray')).toBe(false);
  });
});
