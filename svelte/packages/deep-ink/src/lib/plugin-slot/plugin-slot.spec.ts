import { render, waitFor } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import PluginSlot from './PluginSlot.svelte';
import type { PluginSlotElement } from './plugin-slot.js';

it('forwards point, context and outline as element properties', async () => {
  const context = { theme: 'light' as const };
  const view = render(PluginSlot, { props: { point: 'operation.panels', context, outlined: true } });
  const el = view.container.querySelector('plugin-slot') as PluginSlotElement;
  await waitFor(() => expect(el.point).toBe('operation.panels'));
  expect(el.context).toEqual(context);
  expect(el.outlined).toBe(true);
});
