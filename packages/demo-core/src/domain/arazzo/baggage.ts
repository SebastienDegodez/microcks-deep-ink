/**
 * W3C baggage Microcks sends with every call of a workflow run, so that Live traces can
 * group the calls ("Arazzo only" filter) and link them back to the run.
 */
export function baggage(runId: string, workflowId: string, stepId: string, attempt: number): string {
  return (
    `microcks-arazzo-run=${runId},microcks-arazzo-workflow=${workflowId},` +
    `microcks-arazzo-step=${stepId},microcks-arazzo-attempt=${attempt}`
  );
}

export interface ParsedBaggage {
  runId: string;
  workflowId: string;
  stepId: string;
  attempt: number;
}

export function parseBaggage(text: string): ParsedBaggage | null {
  const map = new Map(text.split(',').map((p) => p.split('=') as [string, string]));
  const runId = map.get('microcks-arazzo-run');
  const workflowId = map.get('microcks-arazzo-workflow');
  const stepId = map.get('microcks-arazzo-step');
  const attempt = Number(map.get('microcks-arazzo-attempt'));
  if (!runId || !workflowId || !stepId || !Number.isFinite(attempt)) return null;
  return { runId, workflowId, stepId, attempt };
}
