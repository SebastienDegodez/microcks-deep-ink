import type { WorkflowContext } from '@/domain/copilot';
import type { Example } from '@/domain/shared';
import type { CopilotExtensions } from '@/application/copilot';
import type { CopilotGateway } from '@/application/ports/copilot';
import { OPERATIONS, WORKFLOWS, after, scenarioRuns, seedRuns, type InMemoryDeps } from '../shared';
import { pastryProposals } from './seed/pastry-pool';

export interface CopilotAdapters {
  copilot: CopilotGateway & CopilotExtensions;
}

const OPERATION_BY_ARAZZO_ID: Record<string, string> = { GetPastries: 'get-list', GetPastryByName: 'get-name', PatchPastry: 'patch-name' };

/** Generic proposals for the other services: one sample per operation rule. */
function genericProposals(serviceId: string, opId: string, count: number): Example[] {
  const op = (OPERATIONS[serviceId] ?? []).find((o) => o.id === opId);
  const names = (op?.rule ?? '').split('&&').map((x) => x.trim()).filter(Boolean);
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: `ai-${opId}-${i + 1}`,
    name: `Generated ${i + 1}`,
    request: { params: Object.fromEntries(names.map((n) => [n, `sample-${i + 1}`])) },
    response: { status: 200, body: JSON.stringify({ id: `sample-${i + 1}`, generated: true }, null, 2) },
    aiGenerated: true,
    reviewState: 'pending' as const,
  }));
}

/** Deterministic "AI": the hint (or a fixed list) gives the names, the bodies are derived from the contract schemas. */
export function createInMemoryCopilotAdapters(_deps: InMemoryDeps = {}): CopilotAdapters {
  const copilot: CopilotGateway & CopilotExtensions = {
    suggestExamples: (serviceId, opId, { count, hint }) =>
      after(() => (serviceId === 'pastry2' ? pastryProposals(opId, count, hint) : genericProposals(serviceId, opId, count))),
    workflowContext: (serviceId, hint) =>
      after<WorkflowContext | undefined>(() => {
        const wanted = hint?.trim().toLowerCase();
        if (serviceId !== 'pastry2' || !wanted) return undefined;
        for (const run of [...seedRuns(), ...scenarioRuns()]) {
          const issue = run.coherence.find((c) => c.copilotHint.toLowerCase() === wanted);
          if (!issue) continue;
          const workflow = WORKFLOWS.find((w) => w.documentId === run.documentId && w.workflowId === run.workflowId);
          const criteria = issue.missing.includes(' for ') ? issue.missing.slice(issue.missing.lastIndexOf(' for ') + 5) : issue.missing;
          return {
            documentId: run.documentId,
            workflowId: run.workflowId,
            workflowSummary: workflow?.summary ?? run.workflowId,
            runId: run.id,
            runNumber: run.number,
            missing: issue.missing,
            arazzoOperationId: issue.operationId,
            operationId: OPERATION_BY_ARAZZO_ID[issue.operationId] ?? 'get-name',
            criteria,
          };
        }
        return undefined;
      }),
  };
  return { copilot };
}
