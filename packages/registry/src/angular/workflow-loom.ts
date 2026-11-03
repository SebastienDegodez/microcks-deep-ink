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

/** The `<workflow-loom>` element and its properties. */
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
  readonly inputs = input<string[]>([]);
  readonly outputs = input<string[]>([]);
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
