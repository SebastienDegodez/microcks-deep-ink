import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ApiBadge from './ApiBadge.svelte';

describe('ApiBadge', () => {
  it('renders protocol/name/version and proof status semantics', async () => {
    const { container } = render(ApiBadge, { props: { protocol: 'REST', name: 'API Pastry', version: '2.0', size: 'compact' } });
    expect(screen.getByText('API Pastry').parentElement?.dataset.size).toBe('compact');
    render(ApiBadge, { props: { label: 'last import', value: 'inactive', status: 'muted' } });
    expect(screen.getByText('inactive').parentElement?.dataset.status).toBe('muted');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('renders status icon, protocol fill and hidden icon-only words', async () => {
    const { container } = render(ApiBadge, { props: { label: 'streaming', status: 'success', icon: 'check', iconLabel: 'supported' } });
    const badge = screen.getByText('streaming').parentElement!;
    expect(badge.querySelector('[data-icon-only]')).toBeTruthy();
    expect(badge.textContent).toContain('supported');
    render(ApiBadge, { props: { label: 'skills', value: '3', status: 'protocol', protocol: 'A2A' } });
    const skills = screen.getByText('skills').parentElement!;
    expect(skills.dataset.fill).toBe('a2a');
    expect(skills.hasAttribute('data-protocol')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });
  it('spaces its parts like the twin: nothing after the version, one space before each proof value', () => {
    render(ApiBadge, { props: { protocol: 'REST', name: 'API Pastry', version: '1.0' } });
    expect(screen.getByText('API Pastry').parentElement?.textContent).toBe('REST API Pastry 1.0');
    render(ApiBadge, { props: { label: 'samples', value: '7', values: [{ value: '+1 AI' }, { value: '2' }] } });
    expect(screen.getByText('samples').parentElement?.textContent).toBe('samples 7  +1 AI 2');
  });
  it('puts a space before each hidden status word, like the twin', () => {
    render(ApiBadge, { props: { label: 'result', value: 'failed', status: 'danger', values: [{ value: '92%', status: 'warning' }] } });
    expect(screen.getByText('result').parentElement?.textContent).toBe('result failed (error)  92% (warning)');
  });
});
