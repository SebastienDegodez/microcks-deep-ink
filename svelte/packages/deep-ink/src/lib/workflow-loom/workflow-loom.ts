import type { LoomSource, LoomStep, LoomThread, LoomInput, LoomOutput } from '../contracts.js';
export interface LoomLensDetail { id?: string; expression?: string }
export interface WorkflowLoomElement extends HTMLElement {
  sources: LoomSource[]; steps: LoomStep[]; threads: LoomThread[];
  inputs: (string | LoomInput)[]; outputs: (string | LoomOutput)[];
  outputNote?: string; validatesSchemas: boolean; selectedStep?: string; lens?: string;
  tableToggle: boolean; label: string; focusStep(stepId: string): Promise<boolean>;
}
