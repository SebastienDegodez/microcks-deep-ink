import type { Operation } from '../shared/index.js';

export interface ServiceArtifact {
  role: 'primary' | 'secondary';
  file: string;
  kind: string;
  summary: string;
}

export interface McpTool {
  name: string;
  description: string;
  method: string;
  path: string;
  /** JSON Schema of the arguments, pretty-printed. */
  inputSchema: string;
}

export interface McpInfo {
  sseUrl: string;
  httpUrl: string;
  tools: McpTool[];
  /** JSON to paste in an MCP client. */
  clientConfig: string;
}

/** What the Properties & MCP tab and the Service header show beyond the catalogue summary. */
export interface ServiceDetails {
  serviceId: string;
  description: string;
  createdAt: string;
  createdLabel: string;
  importedAt: string;
  importedBy: string;
  artifacts: ServiceArtifact[];
  lastImportSummary: string;
  /** Calls over the last 7 days. */
  calls7d: number;
  lastCallAt: string;
  mockBase: string;
  mcp?: McpInfo;
}

/** JSON Schema of the arguments an agent passes to the MCP tool of an operation. */
export function deriveInputSchema(operation: Pick<Operation, 'method' | 'path' | 'dispatcher' | 'rule'>): string {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const match of operation.path.matchAll(/\{([^}]+)\}/g)) {
    const name = match[1] as string;
    properties[name] = { type: 'string', description: `Value of the ${name} path parameter` };
    required.push(name);
  }
  if (operation.dispatcher === 'URI_PARAMS') {
    for (const name of operation.rule.split('&&').map((x) => x.trim()).filter(Boolean)) {
      properties[name] = { type: 'string', description: `Value of the ${name} query parameter` };
      required.push(name);
    }
  }
  if (['POST', 'PUT', 'PATCH'].includes(operation.method)) {
    properties.body = { type: 'object' };
    required.push('body');
  }
  return JSON.stringify({ type: 'object', properties, required }, null, 2);
}

/** MCP tool name of an operation: `get_pastries_name`. */
export function mcpToolName(method: string, path: string): string {
  return `${method}_${path}`
    .toLowerCase()
    .replace(/[{}]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const plus = (text: string) => text.trim().replace(/\s+/g, '+');

/** Where the mock of a service answers (`http://microcks.local:8080/rest/API+Pastry/2.0`). */
export function mockBaseUrl(service: { protocol: string; name: string; version: string }, host: string): string {
  const path = `${plus(service.name)}/${service.version}`;
  switch (service.protocol) {
    case 'REST':
      return `${host}/rest/${path}`;
    case 'SOAP':
      return `${host}/soap/${path}`;
    case 'GRAPHQL':
      return `${host}/graphql/${path}`;
    case 'DIRECT':
      return `${host}/dynarest/${path}`;
    case 'gRPC':
      return 'grpc://microcks.local:9090';
    default:
      return 'kafka://microcks-kafka:9092';
  }
}

/** URLs of the MCP endpoints of an agent-ready service. */
export function mcpBaseUrl(service: { name: string; version: string }, host: string): string {
  return `${host}/mcp/${plus(service.name)}/${service.version}`;
}

/** Name of the entry in an MCP client configuration: `api-pastry`. */
export function mcpServerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
