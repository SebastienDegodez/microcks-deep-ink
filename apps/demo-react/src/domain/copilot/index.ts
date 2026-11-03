import type { Example } from '@/domain/shared';

export interface SuggestionRequest {
  serviceId: string;
  operationId: string;
  count: number;
  hint?: string;
}

export interface ExportedExamples {
  format: 'yaml' | 'json';
  text: string;
}

/** A suggestion waiting for review (always `aiGenerated`, `reviewState: 'pending'`). */
export type PendingExample = Example & { aiGenerated: true; reviewState: 'pending' };
