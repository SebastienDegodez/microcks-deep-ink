import { DestroyRef, Directive, ElementRef, booleanAttribute, effect, inject, input, output } from '@angular/core';
import './elements/workflow-loom.js';

/* Types mirror packages/core/src/utils/types.ts and the React wrapper (keep them identical). */
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

/**
 * Arazzo workflow as a loom. Add it to a template as `<workflow-loom [sources]="…" [steps]="…" [threads]="…"
 * label="…" (stepSelect)="…" />`. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
 */
@Directive({ selector: 'workflow-loom' })
export class WorkflowLoomDirective {
  private readonly host = inject<ElementRef<WorkflowLoomElement>>(ElementRef);

  readonly sources = input.required<LoomSource[]>();
  readonly steps = input.required<LoomStep[]>();
  readonly threads = input.required<LoomThread[]>();
  /** Inputs column: names, or `{ name, expression?, value? }`. */
  readonly inputs = input<(string | LoomInput)[]>([]);
  /** Outputs column: names, or `{ name, value? }`. */
  readonly outputs = input<(string | LoomOutput)[]>([]);
  /** Note under the outputs ("No outputs: #14 failed."). */
  readonly outputNote = input<string | undefined>(undefined);
  /** The run validates schemas: every step shows "Success criteria" and "Schema validation". */
  readonly validatesSchemas = input(false, { transform: booleanAttribute });
  readonly selectedStep = input<string | undefined>(undefined);
  /** Accessible name of the loom. */
  readonly label = input.required<string>();

  /** Emits `{ stepId }` when a step is selected (click, Enter, Space). */
  readonly stepSelect = output<{ stepId: string }>();

  constructor() {
    const el = this.host.nativeElement;
    effect(() => {
      el.sources = this.sources();
    });
    effect(() => {
      el.steps = this.steps();
    });
    effect(() => {
      el.threads = this.threads();
    });
    effect(() => {
      el.inputs = this.inputs();
    });
    effect(() => {
      el.outputs = this.outputs();
    });
    effect(() => {
      el.outputNote = this.outputNote();
    });
    effect(() => {
      el.validatesSchemas = this.validatesSchemas();
    });
    effect(() => {
      el.selectedStep = this.selectedStep();
    });
    effect(() => {
      el.label = this.label();
    });

    const listener = (e: Event) => this.stepSelect.emit((e as CustomEvent<{ stepId: string }>).detail);
    el.addEventListener('mkStepSelect', listener);
    inject(DestroyRef).onDestroy(() => el.removeEventListener('mkStepSelect', listener));
  }
}
