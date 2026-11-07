import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import axe from 'axe-core';
import { LiveIndicator, MethodTag, PROTOCOL_ATTR, StatusBadge, SummaryStrip, SummaryStripSep } from '../src/lib/index.js';
import type { Outcome } from '../src/lib/index.js';
import Composition from './Composition.svelte';

describe('MethodTag', () => {
  for (const [protocol, attr] of Object.entries(PROTOCOL_ATTR)) {
    for (const size of ['md', 'sm', 'xs'] as const) {
      it(`${protocol}/${size} preserves the shared class/attribute contract`, () => {
        const { container } = render(MethodTag, { method: 'POST', protocol: protocol as keyof typeof PROTOCOL_ATTR, size });
        const tag = container.querySelector('.method')!;
        expect(tag.textContent).toBe('POST');
        expect(tag.getAttribute('data-method')).toBe('POST');
        expect(tag.getAttribute('data-protocol')).toBe(attr);
        expect(tag.getAttribute('data-size')).toBe(size === 'md' ? null : size);
      });
    }
  }

  it('forwards native attributes, class values, styles and event handlers', async () => {
    const onClick = vi.fn();
    const { container } = render(Composition, { onClick });
    const tag = container.querySelector<HTMLSpanElement>('.method')!;
    expect(tag.title).toBe('Read operation');
    expect(tag.dataset.native).toBe('yes');
    expect(tag.classList.contains('selected')).toBe(true);
    expect(tag.style.color).toBe('red');
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('99px');
    await fireEvent.click(tag);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('updates props without stale derived attributes', async () => {
    const { container, rerender } = render(MethodTag, { method: 'GET' });
    await rerender({ method: 'PUBLISH', protocol: 'EVENT', size: 'xs', minWidth: 52 });
    const tag = container.querySelector<HTMLSpanElement>('.method')!;
    expect(tag.textContent).toBe('PUBLISH');
    expect(tag.dataset.protocol).toBe('event');
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('52px');
  });

  it('preserves host custom properties when no width override is requested', async () => {
    const style = '--method-min-width: 70px; color: red';
    const { container, rerender } = render(MethodTag, { method: 'GET', style });
    const tag = container.querySelector<HTMLSpanElement>('.method')!;
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('70px');
    await rerender({ minWidth: 52 });
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('52px');
    await rerender({ minWidth: undefined });
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('70px');
    await rerender({ minWidth: 0 });
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('70px');
    expect(tag.style.color).toBe('red');
  });
});

describe('StatusBadge', () => {
  const words: Record<Outcome, string> = {
    conformant: 'Conformant', failed: 'Failed', partial: 'Partial', running: 'Running', never: 'Never tested',
  };
  for (const status of Object.keys(words) as Outcome[]) {
    for (const size of ['md', 'sm', 'lg'] as const) {
      for (const shape of ['circled', 'bare'] as const) {
        it(`${status}/${size}/${shape} includes an outcome word and decorative recipe glyph`, () => {
          const { container } = render(StatusBadge, { status, size, shape, title: 'Outcome', 'data-native': 'yes' });
          const badge = container.querySelector('.status')!;
          expect(badge.textContent?.trim()).toBe(words[status]);
          expect(badge.getAttribute('data-status')).toBe(status);
          expect(badge.getAttribute('data-size')).toBe(size);
          expect(badge.getAttribute('data-shape')).toBe(shape);
          expect(badge.getAttribute('title')).toBe('Outcome');
          const icon = badge.querySelector('svg')!;
          expect(icon.getAttribute('aria-hidden')).toBe('true');
          expect(icon.getAttribute('focusable')).toBe('false');
          const iconSize = size === 'lg' ? 15 : shape === 'circled' ? (size === 'sm' ? 14 : 15) : size === 'sm' ? 13 : 14;
          expect(icon.getAttribute('width')).toBe(String(iconSize));
          if (status === 'never' && shape === 'circled') {
            expect(icon.querySelector('path')?.getAttribute('stroke-dasharray')).toBe('3 3');
          }
        });
      }
    }
  }
  it.each(['', '   '])('falls back for empty label %j', (label) => {
    const { container } = render(StatusBadge, { status: 'failed', label });
    expect(container.textContent?.trim()).toBe('Failed');
  });
  it('updates outcome and icon when props change', async () => {
    const { container, rerender } = render(StatusBadge, { status: 'running' });
    await rerender({ status: 'failed', shape: 'bare' });
    expect(container.textContent?.trim()).toBe('Failed');
    expect(container.querySelector('path')?.getAttribute('d')).toBe('M6 6l12 12M18 6L6 18');
  });
});

describe('LiveIndicator', () => {
  for (const variant of ['pill', 'inline', 'box', 'dot'] as const) {
    for (const size of ['md', 'sm', 'compact', 'lg'] as const) {
      for (const paused of [false, true]) {
        it(`${variant}/${size}/${paused ? 'paused' : 'live'} is not a live region`, () => {
          const { container } = render(LiveIndicator, { variant, size, paused, title: 'Stream', 'data-native': 'yes' });
          const live = container.querySelector('.live')!;
          expect(live.getAttribute('data-variant')).toBe(variant);
          expect(live.getAttribute('data-size')).toBe(size);
          expect(live.hasAttribute('data-paused')).toBe(paused);
          expect(live.textContent?.trim()).toBe(paused ? 'live · paused' : 'live');
          expect(live.hasAttribute('role')).toBe(false);
          expect(live.hasAttribute('aria-live')).toBe(false);
          expect(live.querySelector('.sr-only') !== null).toBe(variant === 'dot');
          expect(live.querySelector('.live-dot') !== null).toBe(!paused);
          expect(live.querySelector(paused ? 'svg' : '.live-dot')?.getAttribute('aria-hidden')).toBe('true');
          expect(live.getAttribute('data-pulse')).toBeNull();
        });
      }
    }
  }
  it('supports custom paused text and an explicitly static compact dot', async () => {
    const { container, rerender } = render(LiveIndicator, { size: 'compact', pulse: false });
    expect(container.querySelector('.live')?.getAttribute('data-pulse')).toBe('false');
    await rerender({ paused: true, pausedLabel: 'paused · 2 new calls' });
    expect(container.textContent?.trim()).toBe('paused · 2 new calls');
  });
});

describe('SummaryStrip', () => {
  for (const variant of ['default', 'canvas'] as const) {
    for (const gap of ['normal', 'roomy'] as const) {
      for (const values of ['secondary', 'text'] as const) {
        for (const lineHeight of ['fixed', 'inherit'] as const) {
          it(`${variant}/${gap}/${values}/${lineHeight} uses shared attribute defaults`, () => {
            const { container } = render(SummaryStrip, {
              variant, gap, values, lineHeight, role: 'note', 'aria-label': 'Facts',
              parts: [{ text: 'Saved', kind: 'label' }, { text: '3 APIs', sep: true }],
            });
            const strip = container.querySelector('.summary-strip')!;
            expect(strip.getAttribute('data-variant')).toBe(variant === 'default' ? null : variant);
            expect(strip.getAttribute('data-gap')).toBe(gap === 'normal' ? null : gap);
            expect(strip.getAttribute('data-values')).toBe(values === 'secondary' ? null : values);
            expect(strip.getAttribute('data-line-height')).toBe(lineHeight === 'fixed' ? null : lineHeight);
            expect(strip.querySelector('.summary-strip-label')?.textContent).toBe('Saved');
            expect(strip.querySelector('.summary-strip-value')?.textContent).toBe('3 APIs');
            expect(strip.querySelector('.summary-strip-sep')?.getAttribute('aria-hidden')).toBe('true');
          });
        }
      }
    }
  }
  it('renders an empty strip and keeps separators decorative even with runtime attrs', () => {
    const { container } = render(SummaryStrip);
    expect(container.querySelector('.summary-strip')?.children.length).toBe(0);
    const result = render(SummaryStripSep, { title: 'Divider', 'aria-hidden': false } as never);
    expect(result.container.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  });
});

it('composes native Svelte snippets, part markup, and free links without losing the status word', () => {
  const { container } = render(Composition, { onClick: () => {} });
  expect(container.querySelector('.summary-strip-value')?.textContent).toBe('3 APIs');
  expect(container.querySelector('.summary-strip-value strong')?.textContent).toBe('3');
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/services');
  expect(container.querySelector('.summary-strip')?.getAttribute('aria-label')).toBe('Import summary');
  expect(container.querySelector('.summary-strip-sep.extra')?.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('.status')?.textContent?.trim()).toBe('Retrying · attempt 2 of 3');
  expect(container.querySelectorAll('.status')[1].textContent?.trim()).toBe('Failed');
});

it('has no structural accessibility violations in composed content', async () => {
  const { container } = render(Composition, { onClick: () => {} });
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations).toEqual([]);
});
