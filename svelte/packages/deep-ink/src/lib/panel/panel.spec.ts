import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Panel from './Panel.svelte';

const html = (h: string) => createRawSnippet(() => ({ render: () => h }));

describe('Panel', () => {
  it('is a region named by its heading, with the actions in the header', async () => {
    const { container } = render(Panel, {
      props: { title: 'Operations', actions: html('<button type="button">Add example</button>'), children: html('<p>Content</p>') },
    });
    const region = screen.getByRole('region', { name: 'Operations' });
    expect(screen.getByRole('heading', { name: 'Operations', level: 2 }).closest('section')).toBe(region);
    expect(screen.getByRole('button', { name: 'Add example' }).parentElement!.className).toBe('panel-actions');
    expect(screen.getByText('Content').parentElement!.className).toBe('panel-body');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('keeps the outline with headingLevel and picks the landmark with as', async () => {
    const { container } = render(Panel, { props: { as: 'aside', title: 'Related', headingLevel: 3 } });
    expect(screen.getByRole('complementary', { name: 'Related' }).localName).toBe('aside');
    expect(screen.getByRole('heading', { name: 'Related', level: 3 })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('has no header and is not a landmark without title nor actions', () => {
    const { container } = render(Panel, { props: { children: html('<p>Body</p>') } });
    expect(container.querySelector('.panel-header')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('section')!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('keeps aria-labelledby without a title, and binds the root element', () => {
    let element: HTMLElement | undefined;
    const { container } = render(Panel, { props: { 'aria-labelledby': 'outer', flush: true, titleStyle: 'label', padding: 'lg', get element() { return element; }, set element(e) { element = e; } } });
    const root = container.querySelector('section')!;
    expect(element).toBe(root);
    expect(root.getAttribute('aria-labelledby')).toBe('outer');
    expect([root.dataset.flush, root.dataset.title, root.dataset.pad]).toEqual(['', 'label', 'lg']);
  });

  it('takes a snippet as title', () => {
    render(Panel, { props: { title: html('<span>Last <em>runs</em></span>') } });
    expect(screen.getByRole('region', { name: 'Last runs' })).toBeTruthy();
  });
});
