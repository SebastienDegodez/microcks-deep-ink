export type Criterion =
  | { type: 'simple'; condition: string }
  | { type: 'regex'; context: string; condition: string };

/** Supported actions: `retry` and `end` only. There is NO `goto` in the POC. */
export type Action =
  | { type: 'end'; name: string; criteria?: Criterion[] }
  | { type: 'retry'; name: string; retryAfter: number; retryLimit: number; criteria?: Criterion[] };

export interface StepParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  /** Runtime expression or literal, e.g. `$inputs.size`. */
  value: string;
}

export interface NamedExpression {
  name: string;
  expression: string;
}

export interface Step {
  stepId: string;
  /** Name of the source description the operation belongs to. */
  sourceName: string;
  operationId: string;
  method: string;
  path: string;
  description: string;
  parameters: StepParameter[];
  requestBody?: string;
  successCriteria: Criterion[];
  onSuccess: Action[];
  onFailure: Action[];
  outputs: NamedExpression[];
  /** Step-level dependsOn (Arazzo 1.1): parallel branches that join. */
  dependsOn?: string[];
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean';
  example?: string;
}

export type Runnability =
  | { runnable: true }
  | { runnable: false; reason: 'asyncapi-steps' | 'source-not-linked'; message: string };

export interface Workflow {
  workflowId: string;
  documentId: string;
  summary: string;
  /** Longer description of the workflow (the Workflow page lead). */
  description?: string;
  inputs: WorkflowInput[];
  steps: Step[];
  outputs: NamedExpression[];
  /** Mock URL (POST) that plays the workflow on the mocks. */
  mockUrl: string;
  runnability: Runnability;
}

/** A recorded example from the ArazzoSources overlay. */
export interface WorkflowExample {
  id: string;
  workflowId: string;
  description: string;
  inputs: Record<string, string | number>;
  steps: { stepId: string; status: number; outputs?: Record<string, string> }[];
  /** Step at which the example stops, when it ends early. */
  stopsAt?: string;
  outputs: Record<string, string | number>;
  /** Last judgement of a run that played the example, when that run is no longer in the run list. */
  lastJudged?: { runNumber: number; at: string; matched: boolean };
}
