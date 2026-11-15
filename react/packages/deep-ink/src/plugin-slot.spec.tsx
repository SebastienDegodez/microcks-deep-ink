import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { PluginSlot, type PluginSlotElement } from './plugin-slot';

describe('PluginSlot', () => {
  it('sets point, context and outlined as element properties and forwards the ref', () => {
    const ref = createRef<PluginSlotElement>();
    const context = { theme: 'light' as const };
    const { container } = render(
      <PluginSlot ref={ref} point="service.tabs" context={context} outlined>
        <p>No plugin</p>
      </PluginSlot>,
    );
    const el = container.querySelector('plugin-slot') as PluginSlotElement;
    expect(ref.current).toBe(el);
    expect(el.point).toBe('service.tabs');
    expect(el.context).toBe(context);
    expect(el.outlined).toBe(true);
  });

  it('defaults the context to the dark theme', () => {
    const { container } = render(<PluginSlot point="nav.items" />);
    expect((container.querySelector('plugin-slot') as PluginSlotElement).context).toEqual({ theme: 'dark' });
  });
});
