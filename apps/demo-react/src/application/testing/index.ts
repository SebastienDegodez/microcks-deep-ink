import {
  runConformance,
  validateTestForm,
  type CreateTestInput,
  type TestRun,
  type TestRunSummary,
  type TestRunner,
  type TestTarget,
} from '@/domain/testing';
import type { SecretSummary, ServiceSummary } from '@/domain/shared';
import { NotFoundError, ValidationError, type Unsubscribe } from '@/application/shared';
import type { ServiceCatalog } from '@/application/ports/catalog';
import type { SecretRepository } from '@/application/ports/importing';
import type { TestRunFilter, TestRunRepository } from '@/application/ports/testing';

export type TestingPorts = {
  testRuns: TestRunRepository;
  catalog: ServiceCatalog;
  secrets: SecretRepository;
};

export const TEST_RUNNERS: readonly { id: TestRunner; label: string; description: string }[] = [
  { id: 'HTTP', label: 'HTTP', description: 'Smoke test: each example request gets a 2xx (or the expected 404) from the endpoint.' },
  {
    id: 'OPEN_API_SCHEMA',
    label: 'OpenAPI schema',
    description: 'Replays the examples, checks the expected status and validates every payload against the OpenAPI schemas.',
  },
  { id: 'SOAP_HTTP', label: 'SOAP over HTTP', description: 'HTTP check, plus response validation against the WSDL and XSD schemas.' },
  { id: 'SOAP_UI', label: 'SoapUI', description: 'Checks the assertions written in the SoapUI test cases.' },
  { id: 'POSTMAN', label: 'Postman', description: 'Runs the test scripts defined in the Postman collection.' },
  {
    id: 'ASYNC_API_SCHEMA',
    label: 'AsyncAPI schema',
    description: 'Connects to the broker, consumes messages and validates them against the AsyncAPI schema.',
  },
  { id: 'GRPC_PROTOBUF', label: 'gRPC protobuf', description: 'Replays the examples and validates responses against the Protobuf schema.' },
  { id: 'GRAPHQL_SCHEMA', label: 'GraphQL schema', description: 'Replays the examples and validates responses against the GraphQL schema.' },
];

export interface CreateTestForm {
  /** Services that can be tested (they have a target). */
  services: ServiceSummary[];
  secrets: SecretSummary[];
  runners: typeof TEST_RUNNERS;
  targets: TestTarget[];
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
  /** Throws `ValidationError` when the endpoint, the timeout or the operations are invalid. */
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
      const [all, secretList, targets] = await Promise.all([catalog.list(), secrets.list(), testRuns.targets()]);
      const services = all.filter((s) => targets.some((t) => t.serviceId === s.id));
      const selected = services.find((s) => s.id === serviceId) ?? services[0];
      const target = targets.find((t) => t.serviceId === selected?.id);
      const recommended = target?.runners.find((r) => r.recommended) ?? target?.runners[0];
      return {
        services,
        secrets: secretList,
        runners: TEST_RUNNERS,
        targets,
        defaults: { timeoutMs: 10_000, runner: recommended?.id ?? 'OPEN_API_SCHEMA', serviceId: selected?.id ?? '' },
      };
    },
    create: async (input) => {
      const target = (await testRuns.targets()).find((t) => t.serviceId === input.serviceId);
      if (!target) throw new ValidationError(`Service "${input.serviceId}" cannot be tested.`);
      const errors = validateTestForm(target.type, {
        endpoint: input.endpoint,
        timeout: String(input.timeoutMs),
        selectedOperations: input.operations ?? target.operations.map((o) => o.id),
        oauth: false,
        clientSecret: '',
      });
      const first = Object.values(errors)[0];
      if (first) throw new ValidationError(first);
      const runner = target.runners.find((r) => r.id === input.runner);
      if (!runner || runner.unavailableReason) throw new ValidationError(`Runner ${input.runner} is not available for this service.`);
      return testRuns.create(input);
    },
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
          conformance: runConformance(r),
        }));
    },
  };
}
