import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { ProjectionPill } from './projection-pill';

describe('ProjectionPill', () => {
  it('writes the default words and keeps the title as extra detail', async () => {
    const { container } = render(<ProjectionPill title="A2A support is a proposed protocol module for Microcks v2" />);
    const pill = screen.getByText('Projection · v2 module');
    expect(pill.className).toBe('projection-pill');
    expect(pill.getAttribute('title')).toContain('proposed');
    expect(await axeViolations(container)).toEqual([]);
  });
});
