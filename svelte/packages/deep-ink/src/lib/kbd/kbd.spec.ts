import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Kbd from './Kbd.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Kbd', () => {
  it('renders a native <kbd> with the kbd class, the className and the other attributes', async () => {
    const { container } = render(Kbd, { props: { className: 'shortcut', title: 'Control', children: text('Ctrl') } });
    const kbd = container.querySelector('kbd')!;
    expect(kbd.className).toBe('kbd shortcut');
    expect(kbd.title).toBe('Control');
    expect(kbd.textContent).toBe('Ctrl');
    expect(await axeViolations(container)).toEqual([]);
  });
});
