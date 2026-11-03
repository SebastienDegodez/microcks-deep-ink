import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES, Icon } from './icon';

describe('Icon', () => {
  it('is decorative by default', () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.getAttribute('class')).toBe('icon');
  });

  it('is an image when it has a label', () => {
    const { container } = render(<Icon name="check" label="Passed" size={20} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Passed');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
    expect(svg.getAttribute('width')).toBe('20');
  });

  it('ships the names required by the contract', () => {
    for (const n of ['spark', 'retry', 'end', 'branch', 'link-out', 'play', 'pause', 'trash', 'undo', 'check', 'cross', 'dash', 'warning', 'info', 'external', 'chevron-down', 'menu', 'search', 'close', 'copy', 'upload', 'tests', 'sun', 'moon']) {
      expect(ICON_NAMES).toContain(n);
    }
  });
});
