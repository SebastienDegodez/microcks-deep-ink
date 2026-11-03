// Deep Ink · mock-url@0.2.0 · copied from packages/registry. You own this file.
import { useState, type HTMLAttributes } from 'react';
import { CopyButton } from './copy-button';
import { MethodTag } from './method-tag';
import { Segmented } from './segmented';

type Format = 'url' | 'curl' | 'httpie' | 'mcp';

export interface MockUrlProps extends HTMLAttributes<HTMLDivElement> {
  url: string;
  method?: string;
  /** MCP tool name: adds the "MCP tool" format for agent-ready services. */
  mcpTool?: string;
  /** Only the URL, the method tag and the copy button (no format group). */
  bare?: boolean;
}

export function snippetFor(format: Format, url: string, method: string, mcpTool?: string): string {
  switch (format) {
    case 'curl':
      return method === 'GET' ? `curl ${url}` : `curl -X ${method} ${url}`;
    case 'httpie':
      return `http ${method} ${url}`;
    case 'mcp':
      return JSON.stringify({ tool: mcpTool, arguments: {} });
    default:
      return url;
  }
}

export function MockUrl({ url, method = 'GET', mcpTool, bare, className, ...rest }: MockUrlProps) {
  const [chosen, setChosen] = useState<Format>('url');
  const format: Format = bare || (chosen === 'mcp' && !mcpTool) ? 'url' : chosen;
  const text = snippetFor(format, url, method, mcpTool);
  const options = [
    { id: 'url', label: 'URL' },
    { id: 'curl', label: 'curl' },
    { id: 'httpie', label: 'HTTPie' },
    ...(mcpTool ? [{ id: 'mcp', label: 'MCP tool' }] : []),
  ];
  const copyLabel = format === 'url' ? 'Copy URL' : `Copy ${options.find((o) => o.id === format)?.label ?? ''}`;
  return (
    <>
      {bare ? null : <Segmented label="Snippet format" options={options} value={format} onChange={(id) => setChosen(id as Format)} />}
      <div {...rest} className={['mock-url', className].filter(Boolean).join(' ')}>
        <MethodTag method={method} />
        <code>{text}</code>
        <CopyButton value={text} label={copyLabel} />
      </div>
    </>
  );
}
