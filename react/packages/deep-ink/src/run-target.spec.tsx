import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RunTarget } from './run-target';

describe('RunTarget', () => {
  it('writes the target word', () => {
    const { container } = render(<RunTarget target="mocks" />);
    const el = container.querySelector('.run-target')!;
    expect(el.textContent).toBe('Mocks');
    expect(el.getAttribute('data-target')).toBe('mocks');
    expect(el.querySelector('.chip')).toBeNull();
  });

  it('flags mixed as a proposal', () => {
    const { container } = render(<RunTarget target="mixed" />);
    expect(container.querySelector('.chip')!.textContent).toBe('Proposed · beyond POC');
  });
});
