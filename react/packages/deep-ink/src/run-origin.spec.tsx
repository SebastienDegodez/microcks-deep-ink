import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RunOrigin } from './run-origin';

describe('RunOrigin', () => {
  it('writes the origin word and exposes it as data-origin', () => {
    const { container } = render(<RunOrigin origin="mock-url" />);
    const el = container.querySelector('.run-origin')!;
    expect(el.textContent).toBe('Mock URL');
    expect(el.getAttribute('data-origin')).toBe('mock-url');
  });

  it('adds the session id only for the session origin', () => {
    const { container, rerender } = render(<RunOrigin origin="session" sessionId="s-7f3a" />);
    expect(container.querySelector('code')!.textContent).toBe('s-7f3a');
    rerender(<RunOrigin origin="api" sessionId="s-7f3a" />);
    expect(container.querySelector('code')).toBeNull();
  });
});
