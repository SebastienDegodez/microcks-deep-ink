import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ProjectionPill from './ProjectionPill.svelte';

describe('ProjectionPill', () => {
  it('writes the default words and keeps the title as extra detail', async () => {
    const { container } = render(ProjectionPill, { props: { title: 'A2A support is a proposed protocol module for Microcks v2' } });
    const pill = screen.getByText('Projection · v2 module');
    expect(pill.className).toBe('projection-pill');
    expect(pill.getAttribute('title')).toContain('proposed');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes other words as children', () => {
    render(ProjectionPill, { props: { children: createRawSnippet(() => ({ render: () => '<span>Projection · MCP module</span>' })) } });
    expect(screen.getByText('Projection · MCP module').parentElement!.className).toBe('projection-pill');
  });
});
