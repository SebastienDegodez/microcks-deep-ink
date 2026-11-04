import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { ApiBadge } from './api-badge';

describe('ApiBadge sizes and neutral proofs', () => {
  it('has a compact size and a muted proof, with the words as the name', async () => {
    const { container } = render(
      <div>
        <ApiBadge size="compact" protocol="REST" name="API Pastry" version="2.0" />
        <ApiBadge size="compact" label="last import" value="inactive" status="muted" />
      </div>,
    );
    expect(screen.getByText('API Pastry').parentElement?.getAttribute('data-size')).toBe('compact');
    const muted = screen.getByText('inactive').parentElement!;
    expect(muted.getAttribute('data-status')).toBe('muted');
    expect(muted.textContent?.trim()).toBe('last import inactive');
    expect(await axeViolations(container)).toEqual([]);
  });
});
