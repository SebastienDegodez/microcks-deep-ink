import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import MockUrl, { snippetFor } from './MockUrl.svelte';

describe('MockUrl', () => {
  it('builds each supported snippet format', () => {
    expect(snippetFor('url', 'http://m/a', 'GET')).toBe('http://m/a');
    expect(snippetFor('curl', 'http://m/a', 'POST')).toBe('curl -X POST http://m/a');
    expect(snippetFor('httpie', 'http://m/a', 'PUT')).toBe('http PUT http://m/a');
    expect(snippetFor('mcp', 'http://m/a', 'GET', 'get_pastry')).toBe('{"tool":"get_pastry","arguments":{}}');
  });
  it('switches format and exposes copy labels, with optional MCP and bare mode', async () => {
    const { container } = render(MockUrl, { props: { url: 'http://m/a', method: 'POST' } });
    expect(screen.getByRole('button', { name: 'Copy URL' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'curl' }));
    expect(container.querySelector('.mock-url code')?.textContent).toBe('curl -X POST http://m/a');
    expect(screen.getByRole('button', { name: 'Copy curl' })).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
    render(MockUrl, { props: { url: 'http://m/a', mcpTool: 'get_pastry' } });
    expect(screen.getByRole('button', { name: 'MCP tool' })).toBeTruthy();
    const { container: bare } = render(MockUrl, { props: { url: 'http://m/a', bare: true } });
    expect(bare.querySelector('[role="group"]')).toBeNull();
  });
});
