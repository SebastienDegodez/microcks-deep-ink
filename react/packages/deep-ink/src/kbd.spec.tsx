import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './kbd';

describe('Kbd', () => {
  it('renders a native <kbd> and forwards attributes', () => {
    const { container } = render(<Kbd className="extra" title="Command">⌘K</Kbd>);
    const kbd = container.querySelector('kbd')!;
    expect(kbd.className).toBe('kbd extra');
    expect(kbd.title).toBe('Command');
    expect(kbd.textContent).toBe('⌘K');
  });
});
