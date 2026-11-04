import {
  deriveInputSchema,
  mcpBaseUrl,
  mcpServerName,
  mockBaseUrl,
  mcpToolName,
  type McpInfo,
  type ServiceArtifact,
  type ServiceDetails,
} from '@/domain/catalog';
import { formatDay } from '@/domain/importing';
import type { Operation, ServiceSummary } from '@/domain/shared';
import { CLOCK_NOW_ISO, MICROCKS_BASE } from '../../shared';

const NOW = Date.parse(CLOCK_NOW_ISO);
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const PASTRY2_SCHEMAS: Record<string, string> = {
  get_pastries: JSON.stringify(
    { type: 'object', properties: { size: { type: 'string', enum: ['S', 'M', 'L'], description: 'Size of pastries' } }, required: ['size'] },
    null,
    2,
  ),
  get_pastries_name: JSON.stringify(
    { type: 'object', properties: { name: { type: 'string', description: 'Name of the pastry' } }, required: ['name'] },
    null,
    2,
  ),
  patch_pastries_name: JSON.stringify(
    {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the pastry' },
        body: { type: 'object', properties: { price: { type: 'number' }, status: { type: 'string', enum: ['available', 'unknown'] } } },
      },
      required: ['name', 'body'],
    },
    null,
    2,
  ),
};

/** Tool descriptions of API Pastry 2.0: the contract's operation summaries, as an agent reads them. */
const PASTRY2_TOOL_DESCRIPTIONS: Record<string, string> = {
  get_pastries: 'Get list of pastries by size',
  get_pastries_name: 'Get Pastry by name',
  patch_pastries_name: 'Update Pastry price or status',
};

const ARTIFACT_BY_PROTOCOL: Record<string, { ext: string; kind: string }> = {
  REST: { ext: 'openapi.yaml', kind: 'OPEN_API_SPEC' },
  EVENT: { ext: 'asyncapi.yaml', kind: 'ASYNC_API_SPEC' },
  gRPC: { ext: 'v1.proto', kind: 'PROTOBUF' },
  GRAPHQL: { ext: 'schema.graphql', kind: 'GRAPHQL_SCHEMA' },
  SOAP: { ext: 'soapui-project.xml', kind: 'SOAP_UI' },
  DIRECT: { ext: 'generated-openapi.yaml', kind: 'OPEN_API_SPEC' },
};

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

function lastCallAgo(calls24h: number): number {
  if (calls24h >= 200) return 4 * MIN;
  if (calls24h >= 50) return 22 * MIN;
  if (calls24h >= 10) return 2 * HOUR;
  return 20 * HOUR;
}

function mcpFor(service: ServiceSummary, operations: Operation[]): McpInfo | undefined {
  if (!service.mcp) return undefined;
  const base = mcpBaseUrl(service, MICROCKS_BASE);
  const tools = operations.map((op) => {
    const name = op.mcpTool ?? mcpToolName(op.method, op.path);
    return {
      name,
      description: (service.id === 'pastry2' ? PASTRY2_TOOL_DESCRIPTIONS[name] : undefined) ?? op.summary,
      method: op.method,
      path: op.path,
      inputSchema: (service.id === 'pastry2' ? PASTRY2_SCHEMAS[name] : undefined) ?? deriveInputSchema(op),
    };
  });
  return {
    sseUrl: `${base}/sse`,
    httpUrl: base,
    tools,
    clientConfig: JSON.stringify({ mcpServers: { [mcpServerName(service.name)]: { type: 'http', url: base } } }, null, 2),
  };
}

export function buildDetails(service: ServiceSummary, operations: Operation[]): ServiceDetails {
  const calls7d = operations.reduce((n, o) => n + o.spark.reduce((a, b) => a + b, 0), 0);
  const importedAt = service.updatedAt;
  const common = {
    serviceId: service.id,
    importedAt,
    calls7d,
    lastCallAt: ago(lastCallAgo(service.calls24h)),
    mockBase: mockBaseUrl(service, MICROCKS_BASE),
    mcp: mcpFor(service, operations),
  };
  if (service.id === 'pastry2') {
    return {
      ...common,
      description: "A bakery demo API: list pastries by size, get a pastry by its name, and update its price or availability.",
      createdAt: '2026-07-14T10:21:00Z',
      createdLabel: 'Jul 14, 2026',
      importedBy: 'MA',
      artifacts: [
        { role: 'primary', file: 'apipastry-2.0-openapi.yaml', kind: 'OPEN_API_SPEC', summary: 'operations, schemas, 6 examples' },
        { role: 'secondary', file: 'apipastry-2.0.postman_collection.json', kind: 'POSTMAN_COLLECTION', summary: '1 PATCH example' },
      ],
      lastImportSummary: 'Manual import by MA · 2 artifacts, 0 warnings',
    };
  }
  const meta = ARTIFACT_BY_PROTOCOL[service.protocol] ?? ARTIFACT_BY_PROTOCOL.REST;
  const kind = service.format.toLowerCase().includes('postman') ? 'POSTMAN_COLLECTION' : (meta?.kind ?? 'OPEN_API_SPEC');
  const file =
    service.protocol === 'DIRECT'
      ? `${slug(service.name)}-${service.version}-generated-openapi.yaml`
      : `${slug(service.name)}-${service.version}-${service.format.toLowerCase().includes('postman') ? 'postman_collection.json' : meta?.ext}`;
  const primary: ServiceArtifact = {
    role: 'primary',
    file,
    kind: service.protocol === 'DIRECT' ? 'Generated from the Direct API form' : kind,
    summary: `${service.operationCount} ${service.operationCount === 1 ? 'operation' : 'operations'}`,
  };
  return {
    ...common,
    description: `${service.format}. ${service.operationCount} ${service.operationCount === 1 ? 'operation' : 'operations'} served as a live mock as soon as the contract is imported.`,
    createdAt: new Date(Date.parse(importedAt) - 30 * DAY).toISOString(),
    createdLabel: formatDay(new Date(Date.parse(importedAt) - 30 * DAY)),
    importedBy: 'MA',
    artifacts: [primary],
    lastImportSummary: `Imported by MA · 1 artifact, 0 warnings`,
  };
}
