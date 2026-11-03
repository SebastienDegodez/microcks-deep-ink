import type { CreateTestInput, TestRun, TestRunSummary } from '@/domain/testing';
import type { Subscribe } from '@/application/shared';

export interface TestRunFilter {
  result?: 'all' | 'passed' | 'failed';
  runner?: string;
  environment?: string;
  /** Maximum number of runs; undefined means the page default. */
  limit?: number;
}

export interface TestRunRepository {
  listForService(serviceId: string, filter?: TestRunFilter): Promise<TestRunSummary[]>;
  /** Most recent runs across services (Cockpit). */
  recent(limit: number): Promise<TestRunSummary[]>;
  get(id: string): Promise<TestRun | undefined>;
  create(input: CreateTestInput): Promise<TestRun>;
  /** Streams the run while it executes: one emission per step (tick 1200 ms), last one is final. */
  watch(id: string): Subscribe<TestRun>;
}
