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
  /** HTTP method drawn as a tag on the node ("GET"); defaults to the first word of `operation`. */
  method?: string;
  /** Path drawn on the node ("/pastries/{name}"); defaults to the rest of `operation`. */
  path?: string;
  /** One-line result of the run ("200 · 3 attempts · 5.4 s"), drawn at the bottom of the node. */
  result?: string;
  /** Arazzo 1.1 step-level dependsOn: independent steps are drawn as parallel branches that join. */
  dependsOn?: string[];
  status?: LoomStepStatus;
  attempts?: number;
  checks?: { successCriteria: LoomCheckState; schemaValidation?: LoomCheckState };
  actions?: LoomAction[];
}

/** Where a thread's value is consumed: a step parameter or body, or a workflow output. */
export interface LoomDrop {
  /** stepId, or '$outputs' */
  to: string;
  /** Chip text: "name · path", "/price · body", "pastryName". */
  label: string;
  /** The consumer did not run, or the run produced no outputs: the chip is muted. */
  idle?: boolean;
  /** The consumer received another value ("Millefeuille"): drawn in danger, "· got Millefeuille". */
  bad?: string;
}

/**
 * A data thread (weft): one runtime expression, its producer and every place that consumes it.
 * The legacy form `{ from, to, expression }` (one consumer per thread) still works: threads with the same
 * producer and expression are woven into one row.
 */
export interface LoomThread {
  /** Stable id, used by the lens. Defaults to the expression. */
  id?: string;
  /** stepId or '$inputs' */
  from: string;
  /** Legacy single consumer: stepId or '$outputs'. Ignored when `drops` is set. */
  to?: string;
  expression: string;
  /** Value in the shown run, already formatted ('"M"'). */
  value?: string;
  /** The run did not produce the value: "— not produced". */
  missing?: boolean;
  drops?: LoomDrop[];
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
  lens?: string;
  tableToggle: boolean;
  label: string;
}

/** Detail of `mkLensSelect`: the traced thread id, undefined when the lens is cleared. */
export interface LoomLensDetail {
  id?: string;
  expression?: string;
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
  /** Id of the traced thread (expression lens); inputs, outputs and thread labels toggle it. */
  lens?: string;
  /** Shows the built-in "Show as table" button (default true). Pass false when the page has its own Steps table. */
  tableToggle?: boolean;
  /** Accessible name of the loom. */
  label: string;
  /** Called with `{ stepId }` when a step is selected (click, Enter, Space); `stepId` is undefined when the selected step is pressed again. */
  onStepSelect?: (detail: { stepId?: string }) => void;
  /** Called with `{ id, expression }` when an input, an output or a thread label is pressed; `id` is undefined when the lens is cleared. */
  onLensSelect?: (detail: LoomLensDetail) => void;
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
  lens,
  tableToggle,
  label,
  onStepSelect,
  onLensSelect,
  ref,
  ...rest
}: WorkflowLoomProps) {
  const el = useRef<WorkflowLoomElement | null>(null);
  const handler = useRef(onStepSelect);
  const lensHandler = useRef(onLensSelect);

  useLayoutEffect(() => {
    handler.current = onStepSelect;
    lensHandler.current = onLensSelect;
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
    if (el.current) el.current.lens = lens;
  }, [lens]);
  useLayoutEffect(() => {
    if (el.current) el.current.tableToggle = tableToggle ?? true;
  }, [tableToggle]);
  useLayoutEffect(() => {
    if (el.current) el.current.label = label;
  }, [label]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const listener = (e: Event) => handler.current?.((e as CustomEvent<{ stepId?: string }>).detail);
    const lensListener = (e: Event) => lensHandler.current?.((e as CustomEvent<LoomLensDetail>).detail);
    node.addEventListener('mkStepSelect', listener);
    node.addEventListener('mkLensSelect', lensListener);
    return () => {
      node.removeEventListener('mkStepSelect', listener);
      node.removeEventListener('mkLensSelect', lensListener);
    };
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
