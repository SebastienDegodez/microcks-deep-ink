import type { ExportedExamples, PendingExample, SuggestionRequest } from '@/domain/copilot';
import type { Example } from '@/domain/shared';
import type { CopilotGateway } from '@/application/ports/copilot';
import type { ServiceCatalog } from '@/application/ports/catalog';

export type CopilotPorts = { copilot: CopilotGateway; catalog: ServiceCatalog };

export interface CopilotUseCases {
  /** Generates `count` pending suggestions for an operation (latency + progress are the page's concern). */
  generate(request: SuggestionRequest): Promise<PendingExample[]>;
  /** Adds the example to the operation; returns it with `reviewState: 'accepted'`. */
  accept(serviceId: string, operationId: string, example: Example): Promise<Example>;
  /** Discards a suggestion. Nothing was stored, so this resolves immediately. */
  reject(serviceId: string, operationId: string, exampleId: string): Promise<void>;
  /** Serialises examples for the Export dialog. */
  export(examples: Example[], format: 'yaml' | 'json'): ExportedExamples;
}

function toYaml(examples: Example[]): string {
  const q = (s: string) => JSON.stringify(s);
  const lines = ['examples:'];
  for (const e of examples) {
    lines.push(`  - name: ${q(e.name)}`, '    request:', '      params:');
    const params = Object.entries(e.request.params);
    if (params.length === 0) lines[lines.length - 1] = '      params: {}';
    for (const [k, v] of params) lines.push(`        ${k}: ${q(v)}`);
    if (e.request.body !== undefined) lines.push(`      body: ${q(e.request.body)}`);
    lines.push('    response:', `      status: ${e.response.status}`, `      body: ${q(e.response.body)}`);
  }
  return lines.join('\n');
}

export function createCopilotUseCases({ copilot, catalog }: CopilotPorts): CopilotUseCases {
  return {
    generate: async ({ serviceId, operationId, count, hint }) => {
      const examples = await copilot.suggestExamples(serviceId, operationId, { count, hint });
      return examples.map((e) => ({ ...e, aiGenerated: true as const, reviewState: 'pending' as const }));
    },
    accept: async (serviceId, operationId, example) => {
      const accepted: Example = { ...example, reviewState: 'accepted' };
      await catalog.addExamples(serviceId, operationId, [accepted]);
      return accepted;
    },
    reject: async () => undefined,
    export: (examples, format) => ({
      format,
      text: format === 'json' ? JSON.stringify({ examples }, null, 2) : toYaml(examples),
    }),
  };
}
