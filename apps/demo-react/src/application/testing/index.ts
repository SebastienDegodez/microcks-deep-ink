import type { CreateTestInput, TestRun, TestRunSummary, TestRunner } from '@/domain/testing';
import type { SecretSummary, ServiceSummary } from '@/domain/shared';
import { NotFoundError, type Unsubscribe } from '@/application/shared';
import type { ServiceCatalog } from '@/application/ports/catalog';
import type { SecretRepository } from '@/application/ports/importing';
import type { TestRunFilter, TestRunRepository } from '@/application/ports/testing';

export type TestingPorts = {
  testRuns: TestRunRepository;
  catalog: ServiceCatalog;
  secrets: SecretRepository;
};

export const TEST_RUNNERS: readonly { id: TestRunner; label: string; description: string }[] = [
  { id: 'HTTP', label: 'HTTP', description: 'Checks the status code of each call.' },
  { id: 'OPEN_API_SCHEMA', label: 'OpenAPI schema', description: 'Validates each response against the OpenAPI schema.' },
  { id: 'SOAP_HTTP', label: 'SOAP over HTTP', description: 'Checks SOAP calls and their status code.' },
  { id: 'SOAP_UI', label: 'SoapUI', description: 'Runs the assertions of the SoapUI project.' },
  { id: 'POSTMAN', label: 'Postman', description: 'Runs the tests of the Postman collection.' },
  { id: 'ASYNC_API_SCHEMA', label: 'AsyncAPI schema', description: 'Validates the messages against the AsyncAPI schema.' },
  { id: 'GRPC_PROTOBUF', label: 'gRPC protobuf', description: 'Checks gRPC responses against the protobuf contract.' },
  { id: 'GRAPHQL_SCHEMA', label: 'GraphQL schema', description: 'Validates responses against the GraphQL schema.' },
];

export interface CreateTestForm {
  services: ServiceSummary[];
  secrets: SecretSummary[];
  runners: typeof TEST_RUNNERS;
  defaults: { timeoutMs: number; runner: TestRunner; serviceId: string };
}

export interface TimelinePoint {
  runId: string;
  startedAt: string;
  durationMs: number;
  result: TestRunSummary['result'];
  /** 0..100 */
  conformance: number;
}

export interface TestingUseCases {
  /** Data for the "Run a test" form; `serviceId` preselects a service (`?service=`). */
  getCreateForm(serviceId?: string): Promise<CreateTestForm>;
  create(input: CreateTestInput): Promise<TestRun>;
  /** Throws `NotFoundError`. */
  get(testRunId: string): Promise<TestRun>;
  /** Streams the run while it executes. */
  watch(testRunId: string, listener: (run: TestRun) => void): Unsubscribe;
  listForService(serviceId: string, filter?: TestRunFilter): Promise<TestRunSummary[]>;
  /** One point per run, oldest first (conformance timeline). */
  timeline(serviceId: string): Promise<TimelinePoint[]>;
}

export function createTestingUseCases({ testRuns, catalog, secrets }: TestingPorts): TestingUseCases {
  return {
    getCreateForm: async (serviceId) => {
      const [services, secretList] = await Promise.all([catalog.list(), secrets.list()]);
      const selected = services.find((s) => s.id === serviceId) ?? services[0];
      return {
        services,
        secrets: secretList,
        runners: TEST_RUNNERS,
        defaults: { timeoutMs: 10_000, runner: 'OPEN_API_SCHEMA', serviceId: selected?.id ?? '' },
      };
    },
    create: (input) => testRuns.create(input),
    get: async (id) => {
      const run = await testRuns.get(id);
      if (!run) throw new NotFoundError('Test run', id);
      return run;
    },
    watch: (id, listener) => testRuns.watch(id)(listener),
    listForService: (serviceId, filter) => testRuns.listForService(serviceId, filter),
    timeline: async (serviceId) => {
      const runs = await testRuns.listForService(serviceId, { limit: 1000 });
      return runs
        .slice()
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
        .map((r) => ({
          runId: r.id,
          startedAt: r.startedAt,
          durationMs: r.durationMs,
          result: r.result,
          conformance: r.total === 0 ? 0 : Math.round((100 * r.passed) / r.total),
        }));
    },
  };
}
