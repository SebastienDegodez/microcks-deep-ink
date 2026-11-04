import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Button } from './button';
import { CiPanel } from './ci-panel';

describe('CiPanel', () => {
  it('is a region named by its title, with a Copy button and the command', async () => {
    const { container } = render(
      <div>
        <Button className="ci-panel-toggle" icon="code" aria-expanded aria-controls="ci">Run it from CI</Button>
        <CiPanel id="ci" dashed title="Run this test in your pipeline" hint="Proposed, not available today." command="microcks test 'Pastry Concierge:1.0'" footnote="Add --keycloakClientId when auth is on." />
      </div>,
    );
    const region = screen.getByRole('region', { name: 'Run this test in your pipeline' });
    expect(region.getAttribute('data-dashed')).toBe('');
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    expect(region.querySelector('pre')?.textContent).toBe("microcks test 'Pastry Concierge:1.0'");
    expect(screen.getByRole('button', { name: 'Run it from CI' }).getAttribute('aria-expanded')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });
});
