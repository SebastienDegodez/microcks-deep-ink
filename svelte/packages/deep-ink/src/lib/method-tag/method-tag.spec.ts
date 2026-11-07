import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import MethodTag from './MethodTag.svelte';
import { PROTOCOL_ATTR, type Protocol } from './method-tag';

describe('MethodTag', () => {
  it('writes the verb as text, with the method and protocol hooks', async () => {
    const { container } = render(MethodTag, { props: { method: 'GET' } });
    const tag = screen.getByText('GET');
    expect([tag.tagName, tag.className, tag.dataset.method, tag.dataset.protocol, tag.hasAttribute('data-size')]).toEqual(['SPAN', 'method', 'GET', 'rest', false]);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('maps every protocol to its data-protocol value', () => {
    for (const [protocol, attr] of Object.entries(PROTOCOL_ATTR)) {
      render(MethodTag, { props: { method: `M-${protocol}`, protocol: protocol as Protocol } });
      expect(screen.getByText(`M-${protocol}`).dataset.protocol).toBe(attr);
    }
  });

  it('sets the size and the minimum width, keeping the given style', () => {
    render(MethodTag, { props: { method: 'PATCH', size: 'sm', minWidth: 52, style: 'opacity: 0.5', className: 'x' } });
    const tag = screen.getByText('PATCH');
    expect(tag.dataset.size).toBe('sm');
    expect(tag.className).toBe('method x');
    expect(tag.style.getPropertyValue('--method-min-width')).toBe('52px');
    expect(tag.style.opacity).toBe('0.5');
  });
});
