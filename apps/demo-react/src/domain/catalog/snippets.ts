import type { Example } from '@/domain/shared';

export type SnippetFormat = 'curl' | 'httpie' | 'mcp';

export interface SnippetSpec {
  method: string;
  /** Operation path template, `/pastries/{name}`. */
  pathTemplate: string;
  example: Example;
  /** `http://microcks.local:8080/rest/API+Pastry/2.0` */
  mockBase: string;
  /** `http://microcks.local:8080/mcp/API+Pastry/2.0` */
  mcpBase: string;
  mcpTool?: string;
}

/**
 * Splits the parameters of an example into the ones that fill the path template and the ones that go
 * to the query string.
 */
export function splitParams(pathTemplate: string, params: Record<string, string>): { path: string; query: [string, string][] } {
  const used = new Set<string>();
  const path = pathTemplate.replace(/\{([^}]+)\}/g, (_, name: string) => {
    used.add(name);
    return encodeURIComponent(params[name] ?? name);
  });
  const query = Object.entries(params).filter(([k]) => !used.has(k));
  return { path, query };
}

/** `/pastries?size=S` or `/pastries/Eclair%20Cafe`. */
export function exampleUrlPath(pathTemplate: string, params: Record<string, string>): string {
  const { path, query } = splitParams(pathTemplate, params);
  return query.length ? `${path}?${query.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}` : path;
}

function compactBody(body: string | undefined): string {
  if (!body) return '';
  try {
    return JSON.stringify(JSON.parse(body));
  } catch {
    return body;
  }
}

export function curlSnippet(spec: SnippetSpec): string {
  const url = `${spec.mockBase}${exampleUrlPath(spec.pathTemplate, spec.example.request.params)}`;
  const body = compactBody(spec.example.request.body);
  return (
    `curl -X ${spec.method} '${url}' \\\n  -H 'Accept: application/json'` +
    (body ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${body}'` : '')
  );
}

export function httpieSnippet(spec: SnippetSpec): string {
  const { path, query } = splitParams(spec.pathTemplate, spec.example.request.params);
  const extras = query.map(([k, v]) => ` ${k}==${v}`).join('');
  let json = '';
  if (spec.example.request.body) {
    try {
      const body = JSON.parse(spec.example.request.body) as Record<string, unknown>;
      json = Object.entries(body)
        .map(([k, v]) => ` ${k}:=${JSON.stringify(v)}`)
        .join('');
    } catch {
      json = '';
    }
  }
  return `http ${spec.method} '${spec.mockBase}${path}' Accept:application/json${extras}${json}`;
}

export function mcpSnippet(spec: SnippetSpec): string {
  const args: Record<string, unknown> = { ...spec.example.request.params };
  if (spec.example.request.body) {
    try {
      args.body = JSON.parse(spec.example.request.body);
    } catch {
      args.body = spec.example.request.body;
    }
  }
  const payload = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: spec.mcpTool ?? 'tool', arguments: args } };
  return `POST ${spec.mcpBase}\nContent-Type: application/json\n\n${JSON.stringify(payload, null, 2)}`;
}

export function buildSnippet(format: SnippetFormat, spec: SnippetSpec): string {
  return format === 'httpie' ? httpieSnippet(spec) : format === 'mcp' ? mcpSnippet(spec) : curlSnippet(spec);
}

/** The raw HTTP request the example stands for, as the Request pane of the Service screen shows it. */
export function requestHead(spec: SnippetSpec): string {
  const url = new URL(`${spec.mockBase}${exampleUrlPath(spec.pathTemplate, spec.example.request.params)}`);
  return (
    `${spec.method} ${url.pathname}${url.search} HTTP/1.1\nHost: ${url.host}\nAccept: application/json` +
    (spec.example.request.body ? '\nContent-Type: application/json' : '')
  );
}

/** `path    name = Millefeuille` lines, one per parameter, for the Request pane. */
export function paramLines(pathTemplate: string, params: Record<string, string>): string {
  const { query } = splitParams(pathTemplate, params);
  const queryNames = new Set(query.map(([k]) => k));
  return Object.entries(params)
    .map(([k, v]) => `${queryNames.has(k) ? 'query ' : 'path  '}  ${k} = ${v}`)
    .join('\n');
}
