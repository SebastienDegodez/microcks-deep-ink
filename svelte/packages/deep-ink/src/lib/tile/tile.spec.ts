import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import TileHarness from '../../../test/fixtures/TileHarness.svelte';
import Tile from './Tile.svelte';

describe('Tile', () => {
  it('is an article named by its title, with one stretched link', async () => {
    const { container } = render(TileHarness);
    expect(screen.getByRole('region', { name: 'Packages' })).toBeTruthy();
    const article = screen.getByRole('article', { name: 'Open Banking' });
    const link = screen.getByRole('link', { name: 'Open Banking' });
    expect(link.className).toBe('tile-action');
    expect(article.contains(link)).toBe(true);
    expect(screen.getByRole('heading', { level: 3, name: 'Open Banking' })).toBeTruthy();
    expect(article.hasAttribute('data-interactive')).toBe(true);
    expect(link.querySelector('a, button')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('marks the selected link with aria-current', () => {
    render(Tile, { props: { title: 'Open Banking', href: '#/hub/banking', selected: true } });
    expect(screen.getByRole('link', { name: 'Open Banking' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('article').hasAttribute('data-selected')).toBe(true);
  });

  it('is a toggle button when selectable', () => {
    const onSelect = vi.fn();
    render(Tile, { props: { title: 'Open Banking', onSelect, selected: false } });
    const button = screen.getByRole('button', { name: 'Open Banking', pressed: false });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('is static without an action', () => {
    render(Tile, { props: { title: 'Open Banking' } });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('article').hasAttribute('data-interactive')).toBe(false);
  });

  it('renders the title link with renderAction, given the action props', async () => {
    const { container } = render(TileHarness, { props: { custom: true } });
    const link = screen.getByRole('link', { name: 'Open Banking' });
    expect([link.className, link.getAttribute('aria-current'), link.dataset.router]).toEqual(['tile-action', 'true', '']);
    expect(screen.getByRole('article', { name: 'Open Banking' }).hasAttribute('data-interactive')).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });
});
