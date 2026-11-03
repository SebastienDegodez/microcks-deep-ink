import type { Dispatcher, Example, Label } from '@/domain/shared';

/** Parameter constraint of an operation (Behavior screen). */
export interface ParameterConstraint {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  recopy?: boolean;
  mustMatchRegexp?: string;
}

/** How an operation answers: dispatcher, rules, delay and constraints. */
export interface Behavior {
  dispatcher: Dispatcher;
  rule: string;
  delayMs: number;
  constraints: ParameterConstraint[];
  stateful: boolean;
}

/** A workflow that calls an operation (for "Used by workflows"). */
export interface WorkflowUsage {
  documentId: string;
  workflowId: string;
  summary: string;
  stepIds: string[];
}

export interface SimulationRequest {
  /** Request path or query string typed in the simulator, e.g. `/pastries/Eclair%20Cafe`. */
  path: string;
  params: Record<string, string>;
  body?: string;
}

export type SimulationResult =
  | { matched: true; exampleId: string; example: Example }
  | { matched: false; reason: string };

export interface LabelCount {
  label: Label;
  count: number;
}

export interface ServiceFilter {
  query?: string;
  protocols?: string[];
  /** `key=value` strings. A service must carry ALL of them. */
  labels?: string[];
  testStatus?: 'all' | 'passed' | 'failed' | 'never';
}

/** Entry of the command bar (⌘K). Same shape as the design system's `CommandItem`. */
export interface CommandItem {
  id: string;
  label: string;
  kind: string;
  hint?: string;
  /** Hash route to navigate to, e.g. `/services/pastry2`. */
  href?: string;
}
