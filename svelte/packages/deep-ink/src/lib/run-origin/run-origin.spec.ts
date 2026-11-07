import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import RunOrigin from './RunOrigin.svelte';

describe('RunOrigin', () => {
  it('writes the origin and, for a session, its id in full', async () => {
    const { container } = render(RunOrigin, { props: { origin: 'session', sessionId: 's-7f3a2c91' } });
    const origin = container.querySelector('.run-origin')!;
    expect([origin.textContent, origin.getAttribute('data-origin')]).toEqual(['Sessions-7f3a2c91', 'session']);
    expect(screen.getByText('s-7f3a2c91').tagName).toBe('CODE');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('writes the words of the other origins, without a session id', () => {
    const words = (['ui', 'api', 'mock-url'] as const).map((origin) => render(RunOrigin, { props: { origin, sessionId: 's-1' } }).container.textContent);
    expect(words).toEqual(['UI', 'API', 'Mock URL']);
  });
});
