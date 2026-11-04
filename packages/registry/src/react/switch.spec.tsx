import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Switch } from './switch';

describe('Switch size', () => {
  it('has a large size', () => {
    render(<Switch label="Stateful" size="lg" checked onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Stateful' }).getAttribute('data-size')).toBe('lg');
  });
});
