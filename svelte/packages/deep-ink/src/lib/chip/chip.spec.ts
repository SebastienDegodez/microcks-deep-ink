import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import { PROTOCOL_ATTR, type Protocol } from '../method-tag/method-tag';
import Chip from './Chip.svelte';

const html = (h: string) => createRawSnippet(() => ({ render: () => h }));

describe('Chip', () => {
  it('is a static span with tone, variant and size hooks, skipped by Tab', async () => {
    const { container } = render(Chip, { props: { tone: 'warning', variant: 'dashed', size: 'sm', labelKey: 'owner', children: 'team-a' } });
    const chip = container.querySelector<HTMLElement>('.chip')!;
    expect([chip.tagName, chip.dataset.tone, chip.dataset.variant, chip.dataset.size, chip.textContent]).toEqual(['SPAN', 'warning', 'dashed', 'sm', 'owner=team-a']);
    expect(screen.queryByRole('button')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is a toggle button with aria-pressed when pressed is given, the count read after the text', async () => {
    const onclick = vi.fn();
    const { container } = render(Chip, { props: { pressed: false, protocol: 'gRPC', count: 0, size: 'lg', onclick, children: 'gRPC' } });
    const toggle = screen.getByRole('button', { name: 'gRPC 0' });
    expect([toggle.getAttribute('aria-pressed'), toggle.dataset.protocol, toggle.hasAttribute('data-empty')]).toEqual(['false', 'grpc', true]);
    await fireEvent.click(toggle);
    expect(onclick).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('maps every protocol to its data-protocol value', () => {
    for (const [protocol, attr] of Object.entries(PROTOCOL_ATTR)) {
      const { container } = render(Chip, { props: { protocol: protocol as Protocol, children: protocol } });
      expect(container.querySelector<HTMLElement>('.chip')!.dataset.protocol).toBe(attr);
    }
  });

  it('adds a remove button named "Remove <key> <text>" that calls onremove', async () => {
    const onremove = vi.fn();
    const { container } = render(Chip, { props: { tone: 'info', labelKey: 'env', onremove, children: 'prod' } });
    const remove = screen.getByRole('button', { name: 'Remove env prod' });
    expect(remove.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    await fireEvent.click(remove);
    expect(onremove).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('names the remove button from snippet text or from removeLabel, and has none on toggles', () => {
    render(Chip, { props: { onremove: () => {}, children: html('<b>beta</b>') } });
    expect(screen.getByRole('button', { name: 'Remove beta' })).toBeTruthy();
    render(Chip, { props: { onremove: () => {}, removeLabel: 'Clear filter', children: 'x' } });
    expect(screen.getByRole('button', { name: 'Clear filter' })).toBeTruthy();
    render(Chip, { props: { pressed: true, onremove: () => {}, children: 'All' } });
    expect(screen.getByRole('button', { name: 'All' }).querySelector('.chip-remove')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});
