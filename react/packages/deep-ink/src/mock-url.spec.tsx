import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { MockUrl, snippetFor } from './mock-url';

describe('snippetFor', () => {
  it('builds each format', () => {
    expect(snippetFor('url', 'http://m/a', 'GET')).toBe('http://m/a');
    expect(snippetFor('curl', 'http://m/a', 'GET')).toBe('curl http://m/a');
    expect(snippetFor('curl', 'http://m/a', 'POST')).toBe('curl -X POST http://m/a');
    expect(snippetFor('httpie', 'http://m/a', 'PUT')).toBe('http PUT http://m/a');
    expect(snippetFor('mcp', 'http://m/a', 'GET', 'get_pastry')).toBe('{"tool":"get_pastry","arguments":{}}');
  });
});

describe('MockUrl', () => {
  it('switches format and the copy label follows', async () => {
    const { container } = render(<MockUrl url="http://m/a" method="POST" />);
    expect(container.querySelector('.mock-url code')!.textContent).toBe('http://m/a');
    expect(screen.getByRole('button', { name: 'Copy URL' })).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'curl' }));
    });
    expect(container.querySelector('.mock-url code')!.textContent).toBe('curl -X POST http://m/a');
    expect(screen.getByRole('button', { name: 'Copy curl' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'MCP tool' })).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('offers the MCP format only with mcpTool, and bare hides the format group', () => {
    const { unmount } = render(<MockUrl url="http://m/a" mcpTool="get_pastry" />);
    expect(screen.getByRole('button', { name: 'MCP tool' })).toBeTruthy();
    unmount();
    render(<MockUrl url="http://m/a" bare />);
    expect(screen.queryByRole('group', { name: 'Snippet format' })).toBeNull();
  });
});
