import type { HTMLAttributes } from 'svelte/elements';
export type MockUrlFormat = 'url' | 'curl' | 'httpie' | 'mcp';
export interface MockUrlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> { url: string; method?: string; mcpTool?: string; bare?: boolean; class?: string }
export function snippetFor(format: MockUrlFormat, url: string, method: string, mcpTool?: string): string {
  switch (format) { case 'curl': return method === 'GET' ? `curl ${url}` : `curl -X ${method} ${url}`; case 'httpie': return `http ${method} ${url}`; case 'mcp': return JSON.stringify({ tool: mcpTool, arguments: {} }); default: return url; }
}
