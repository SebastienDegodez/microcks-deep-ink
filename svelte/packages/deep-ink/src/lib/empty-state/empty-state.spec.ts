import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import EmptyState from './EmptyState.svelte';

const html = (h: string) => createRawSnippet(() => ({ render: () => h }));

describe('EmptyState', () => {
  it('is a region labelled by a level-2 heading, with the body and snippet actions', async () => {
    const { container } = render(EmptyState, {
      props: { title: 'No services yet', children: html('<p>Import a contract.</p>'), actions: html('<button type="button">Import</button>') },
    });
    const region = screen.getByRole('region', { name: 'No services yet' });
    expect(screen.getByRole('heading', { level: 2, name: 'No services yet' }).className).toBe('empty-title');
    expect(region.dataset.align).toBe('center');
    expect(region.querySelector('.empty-body')!.textContent).toBe('Import a contract.');
    expect(screen.getByRole('button', { name: 'Import' }).parentElement!.className).toBe('empty-actions');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes the heading level, a decorative icon, the start alignment and string actions', async () => {
    const { container } = render(EmptyState, { props: { title: 'No runs yet', headingLevel: 3, icon: 'search-x', align: 'start', actions: 'Run a test' } });
    expect(screen.getByRole('heading', { level: 3, name: 'No runs yet' })).toBeTruthy();
    expect(container.querySelector('.empty-icon svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.empty-icon svg')!.getAttribute('width')).toBe('40');
    expect(container.querySelector('.empty-actions')!.textContent).toBe('Run a test');
    expect(container.querySelector('.empty-body')).toBeNull();
    expect(container.querySelector('section')!.dataset.align).toBe('start');
    expect(await axeViolations(container)).toEqual([]);
  });
});
