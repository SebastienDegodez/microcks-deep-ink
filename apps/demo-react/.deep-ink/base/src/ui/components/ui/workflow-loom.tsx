// Deep Ink · workflow-loom@0.2.0 · copied from packages/registry. You own this file.
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react';
import './elements/workflow-loom.js';

/* Types mirror packages/core/src/utils/types.ts (a parity test keeps them identical). */
export type LoomProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
export type LoomStepStatus = 'passed' | 'failed' | 'not-run';
export type LoomCheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface LoomSource {
  name: string;
  type: 'openapi' | 'asyncapi';
  protocol: LoomProtocol;
  linked: boolean;
  /** Title and version of the source's API, shown in the lane header: "API Pastry 2.0". */
  serviceLabel?: string;
}

export type LoomAction =
  | {
      type: 'end';
      name: string;
      on: 'success' | 'failure';
      criteria: string;
      taken?: boolean;
      /** Short criteria drawn on the loom ("status == 'available'"); `criteria` stays the accessible text. */
      label?: string;
      /** Run the `taken` state comes from ("#14"): "not taken in #14". */
      runLabel?: string;
    }
  | {
      type: 'retry';
      name: string;
      on: 'failure';
      retryAfter: number;
      retryLimit: number;
      applied?: boolean;
      /** Run the attempts come from ("#14"): "3 attempts in #14". */
      runLabel?: string;
    };

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

/** Workflow input, drawn in the inputs column. A bare string is the input name. */
export interface LoomInput {
  name: string;
  /** Defaults to "$inputs.<name>". */
  expression?: string;
  /** Value in the shown run, already formatted ('"M"', '3.9'). */
  value?: string;
}

/** Workflow output, drawn in the outputs column. A bare string is the output name. */
export interface LoomOutput {
  name: string;
  /** Value in the shown run, already formatted; "—" when absent. */
  value?: string;
}

/** The `<workflow-loom>` element and its properties. */
export interface WorkflowLoomElement extends HTMLElement {
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  inputs: (string | LoomInput)[];
  outputs: (string | LoomOutput)[];
  outputNote?: string;
  validatesSchemas: boolean;
  selectedStep?: string;
  label: string;
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'workflow-loom': DetailedHTMLProps<HTMLAttributes<WorkflowLoomElement>, WorkflowLoomElement>;
    }
  }
}

export interface WorkflowLoomProps extends Omit<HTMLAttributes<WorkflowLoomElement>, 'children'> {
  sources: LoomSource[];
  steps: LoomStep[];
  threads: LoomThread[];
  /** Inputs column: names, or `{ name, expression?, value? }`. */
  inputs?: (string | LoomInput)[];
  /** Outputs column: names, or `{ name, value? }`. */
  outputs?: (string | LoomOutput)[];
  /** Note under the outputs ("No outputs: #14 failed."). */
  outputNote?: string;
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
 * Wrapper around the self-registering `<workflow-loom>` element in ./elements.
 */
export function WorkflowLoom({
  sources,
  steps,
  threads,
  inputs,
  outputs,
  outputNote,
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
    if (el.current) el.current.outputNote = outputNote;
  }, [outputNote]);
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
    <workflow-loom
      {...rest}
      ref={(node) => {
        el.current = node;
        assignRef(ref, node);
      }}
    />
  );
}
