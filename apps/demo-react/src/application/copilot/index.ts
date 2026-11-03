import { toApiExamples, type ExampleGroup, type ExportedExamples, type PendingExample, type SuggestionRequest, type WorkflowContext } from '@/domain/copilot';
import type { Example } from '@/domain/shared';
import type { CopilotGateway } from '@/application/ports/copilot';
import type { ServiceCatalog } from '@/application/ports/catalog';

/** Capabilities of the Copilot adapter beyond the `CopilotGateway` port (read-only in phase 2). */
export interface CopilotExtensions {
  /** The workflow run that lacks an example for `hint`, when the person comes from a run. */
  workflowContext(serviceId: string, hint?: string): Promise<WorkflowContext | undefined>;
}

export type CopilotPorts = { copilot: CopilotGateway & CopilotExtensions; catalog: ServiceCatalog };

export interface GenerateOptions extends SuggestionRequest {
  /** Names the person already accepted: they are not proposed again. */
  exclude?: string[];
}

export interface CopilotUseCases {
  /** Generates `count` pending suggestions for an operation (latency + progress are the page's concern). */
  generate(request: GenerateOptions): Promise<PendingExample[]>;
  /** Adds the example to the operation; returns it with `reviewState: 'accepted'`. */
  accept(serviceId: string, operationId: string, example: Example): Promise<Example>;
  /** Discards a suggestion. Nothing was stored, so this resolves immediately. */
  reject(serviceId: string, operationId: string, exampleId: string): Promise<void>;
  /** Serialises examples for the Export dialog. */
  export(examples: Example[], format: 'yaml' | 'json'): ExportedExamples;
  /** The `APIExamples` artifact for the accepted examples of several operations. */
  exportApiExamples(target: { name: string; version: string }, groups: ExampleGroup[], format: 'yaml' | 'json'): ExportedExamples;
  /** Workflow context of the page (`?hint=` from a workflow run), if any run lacks that example. */
  findWorkflowContext(serviceId: string, hint?: string): Promise<WorkflowContext | undefined>;
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
    generate: async ({ serviceId, operationId, count, hint, exclude = [] }) => {
      const skip = new Set(exclude.map((n) => n.toLowerCase()));
      const examples = await copilot.suggestExamples(serviceId, operationId, { count: count + skip.size, hint });
      return examples
        .filter((e) => !skip.has(e.name.toLowerCase()))
        .slice(0, Math.max(1, count))
        .map((e) => ({ ...e, aiGenerated: true as const, reviewState: 'pending' as const }));
    },
    accept: async (serviceId, operationId, example) => {
      const accepted: Example = { ...example, aiGenerated: true, reviewState: 'accepted' };
      await catalog.addExamples(serviceId, operationId, [accepted]);
      return accepted;
    },
    reject: async () => undefined,
    export: (examples, format) => ({
      format,
      text: format === 'json' ? JSON.stringify({ examples }, null, 2) : toYaml(examples),
    }),
    exportApiExamples: (target, groups, format) => ({ format, text: toApiExamples(target, groups, format) }),
    findWorkflowContext: (serviceId, hint) => copilot.workflowContext(serviceId, hint),
  };
}
