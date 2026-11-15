import type { Example } from '../../domain/shared/index.js';

export interface CopilotGateway {
  /** Generates examples for an operation. Results are `aiGenerated`, `reviewState: 'pending'`. */
  suggestExamples(serviceId: string, opId: string, options: { count: number; hint?: string }): Promise<Example[]>;
}
