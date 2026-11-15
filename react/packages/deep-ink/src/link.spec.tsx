import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { Link } from './link';

describe('Link', () => {
  it('is a native anchor that keeps target and rel', () => {
    render(<Link href="/a" target="_self" rel="next">Next</Link>);
    const a = screen.getByRole('link', { name: 'Next' });
    expect(a.className).toBe('link');
    expect(a.getAttribute('target')).toBe('_self');
    expect(a.getAttribute('rel')).toBe('next');
  });

  it('external: new tab, safe rel and a spoken notice', async () => {
    const { container } = render(<Link href="https://microcks.io" external>Docs</Link>);
    const a = screen.getByRole('link', { name: /Docs.*opens in a new tab/ });
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.hasAttribute('data-external')).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes a translated external notice', () => {
    render(<Link href="https://microcks.io" external externalLabel="(nouvel onglet)">Docs</Link>);
    expect(screen.getByRole('link', { name: /Docs.*nouvel onglet/ })).toBeTruthy();
  });
});
