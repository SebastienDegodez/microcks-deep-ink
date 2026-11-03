import { useEffect, useLayoutEffect, useRef } from 'react';
import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';
import './elements/mk-workflow-loom.js';

/* Types mirror packages/core/src/utils/types.ts (a parity test keeps them identical). */
export type LoomProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';
export type LoomStepStatus = 'passed' | 'failed' | 'not-run';
export type LoomCheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface LoomSource {
  name: string;
  type: 'openapi' | 'asyncapi';
  protocol: LoomProtocol;
  linked: boolean;
}

export type LoomAction =
  | { type: 'end'; name: string; on: 'success' | 'failure'; criteria: string; taken?: boolean }
  | { type: 'retry'; name: string; on: 'failure'; retryAfter: number; retryLimit: number; applied?: boolean };

export interface LoomStep {
  stepId: string;
  source: string;
  /** "GET /pastries" */
  operation: string;
  /** Arazzo 1.1 step-level dependsOn: independent steps are drawn as parallel branches that join. */
  dependsOn?: string[];
  status?: LoomStepStatus;
  attempts?: number;
  checks?: { successCriteria: LoomCheckState; schemaValidation?: LoomCheckState };
  actions?: LoomAction[];
}

export interface LoomThread {
  /** stepId or '$inputs' */
  from: string;
  /** stepId or '$outputs' */
  to: string;
  expression: string;
}

/** The `<mk-workflow-loom>` element and its properties. */
export interface WorkflowLoomElement extends HTMLElement {
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  inputs: string[];
  outputs: string[];
  validatesSchemas: boolean;
  selectedStep?: string;
  label: string;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'mk-workflow-loom': DetailedHTMLProps<HTMLAttributes<WorkflowLoomElement>, WorkflowLoomElement>;
    }
  }
}

export interface WorkflowLoomProps extends Omit<HTMLAttributes<WorkflowLoomElement>, 'children'> {
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  inputs?: string[];
  outputs?: string[];
  /** The run validates schemas: every step shows "Success criteria" and "Schema validation". */
  validatesSchemas?: boolean;
  selectedStep?: string;
  /** Accessible name of the loom. */
  label: string;
  /** Called with `{ stepId }` when a step is selected (click, Enter, Space). */
  onStepSelect?: (detail: { stepId: string }) => void;
  ref?: Ref<WorkflowLoomElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Arazzo workflow as a loom: lanes per source, step nodes, data threads, parallel branches
 * (dependsOn), `end` and `retry` actions. Keyboard operable, with a built-in "Show as table" view.
 * Wrapper around the self-registering `<mk-workflow-loom>` element in ./elements.
 */
export function WorkflowLoom({
  sources,
  steps,
  threads,
  inputs,
  outputs,
  validatesSchemas,
  selectedStep,
  label,
  onStepSelect,
  ref,
  ...rest
}: WorkflowLoomProps) {
  const el = useRef<WorkflowLoomElement | null>(null);
  const handler = useRef(onStepSelect);

  useLayoutEffect(() => {
    handler.current = onStepSelect;
  });
  useLayoutEffect(() => {
    if (el.current) el.current.sources = sources;
  }, [sources]);
  useLayoutEffect(() => {
    if (el.current) el.current.steps = steps;
  }, [steps]);
  useLayoutEffect(() => {
    if (el.current) el.current.threads = threads;
  }, [threads]);
  useLayoutEffect(() => {
    if (el.current) el.current.inputs = inputs ?? [];
  }, [inputs]);
  useLayoutEffect(() => {
    if (el.current) el.current.outputs = outputs ?? [];
  }, [outputs]);
  useLayoutEffect(() => {
    if (el.current) el.current.validatesSchemas = validatesSchemas ?? false;
  }, [validatesSchemas]);
  useLayoutEffect(() => {
    if (el.current) el.current.selectedStep = selectedStep;
  }, [selectedStep]);
  useLayoutEffect(() => {
    if (el.current) el.current.label = label;
  }, [label]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const listener = (e: Event) => handler.current?.((e as CustomEvent<{ stepId: string }>).detail);
    node.addEventListener('mkStepSelect', listener);
    return () => node.removeEventListener('mkStepSelect', listener);
  }, []);

  return (
    <mk-workflow-loom
      {...rest}
      ref={(node) => {
        el.current = node;
        assignRef(ref, node);
      }}
    />
  );
}
