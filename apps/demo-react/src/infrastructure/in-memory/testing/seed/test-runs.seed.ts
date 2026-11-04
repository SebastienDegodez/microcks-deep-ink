import type { ContractProperty, OperationOutcome, TestEnvironment, TestResult, TestRun, TestRunner, TestStepResult } from '@/domain/testing';
import { OPERATIONS, RUN_IDS, STAGING_BASE } from '../../shared';

export const PROD_BASE = 'https://pastry.acme.io/v2';
export const LOCAL_BASE = 'http://localhost:8282/v2';
export const ENDPOINTS: Record<TestEnvironment, string> = { staging: STAGING_BASE, prod: PROD_BASE, local: LOCAL_BASE };

/** Resolved `Pastry` schema of API Pastry 2.0, aligned with the responses in the diff. */
export const PASTRY_CONTRACT: ContractProperty[] = [
  { key: 'name', schema: '{ type: string }' },
  { key: 'description', schema: '{ type: string }' },
  { key: 'size', schema: '{ type: string, enum: [S, M, L] }' },
  { key: 'price', schema: '{ type: number }' },
  { key: 'status', schema: '{ type: string, enum: [available, unknown] }' },
];

const PASTRIES = {
  mille: { name: 'Millefeuille', description: 'Delicious Millefeuille, not caloric at all', size: 'L', price: 4.4, status: 'available' },
  cafe: { name: 'Eclair Cafe', description: 'Delicious Coffee Eclair, not caloric at all', size: 'M', price: 2.5, status: 'available' },
  choco: { name: 'Eclair Chocolat', description: 'Delicious Chocolate Eclair, not caloric at all', size: 'M', price: 2.4, status: 'unknown' },
  fraise: { name: 'Tartelette Fraise', description: 'Delicious Strawberry Tartlet, fresh strawberries', size: 'S', price: 2.0, status: 'available' },
};

export const OPERATION_LABELS = [
  { id: 'get-list', method: 'GET', path: '/pastries' },
  { id: 'get-name', method: 'GET', path: '/pastries/{name}' },
  { id: 'patch-name', method: 'PATCH', path: '/pastries/{name}' },
];

const CONTRACT_FILE = 'apipastry-2.0-openapi.yaml';
const SCHEMA_REF = '#/components/schemas/Pastry';

function step(n: number, operationId: string, name: string, method: string, path: string, ms: number, payload: unknown): TestStepResult {
  return {
    id: `s${n}`, operationId, name, method, path, ms, result: 'passed', violations: [], httpStatus: 200, payload,
    schemaRef: SCHEMA_REF, contract: PASTRY_CONTRACT,
  };
}

/** The 7 steps of a passing run of API Pastry 2.0. */
export function passingSteps(): TestStepResult[] {
  return [
    step(1, 'get-list', 'Size S', 'GET', '/pastries?size=S', 38, [PASTRIES.fraise]),
    step(2, 'get-list', 'Size M', 'GET', '/pastries?size=M', 41, [PASTRIES.cafe, PASTRIES.choco]),
    step(3, 'get-list', 'Size L', 'GET', '/pastries?size=L', 35, [PASTRIES.mille]),
    step(4, 'get-name', 'Millefeuille', 'GET', '/pastries/Millefeuille', 29, PASTRIES.mille),
    step(5, 'get-name', 'Eclair Cafe', 'GET', '/pastries/Eclair%20Cafe', 31, PASTRIES.cafe),
    step(6, 'get-name', 'Eclair Chocolat', 'GET', '/pastries/Eclair%20Chocolat', 27, PASTRIES.choco),
    { ...step(7, 'patch-name', 'Eclair Chocolat · price', 'PATCH', '/pastries/Eclair%20Chocolat', 64, { ...PASTRIES.choco, price: 2.6 }), requestBody: '{"price":2.6}' },
  ];
}

const PRICE_VIOLATION = {
  path: '$.price',
  message: 'The contract expects a number; the implementation returned the string "2.6".',
  raw: 'instance type (string) does not match any allowed primitive type (allowed: ["integer","number"])',
};
const STATUS_VIOLATION = {
  path: '$.status',
  message: 'Enum value "sold-out" is not in [available, unknown].',
  raw: 'instance value ("sold-out") not found in enum (possible values: ["available","unknown"])',
};

/** The 7 steps of test run #119: the PATCH returns `price` as the string "2.6" and an unknown status. */
export function failingSteps(): TestStepResult[] {
  return passingSteps().map((s) =>
    s.id === 's7'
      ? { ...s, result: 'failed' as const, violations: [PRICE_VIOLATION, STATUS_VIOLATION], payload: { ...PASTRIES.choco, price: '2.6', status: 'sold-out' } }
      : s,
  );
}

type RawRun = {
  n: number;
  at: string;
  env: TestEnvironment;
  runner: TestRunner;
  ms: number;
  res: Exclude<TestResult, 'running'>;
  /** p = passed, f = failed, n = no result, for each operation. */
  ops: string;
  reason?: string;
  /** Stored conformance score, when the prototype gives one that is not passed/total. */
  score?: number;
};

const PATCH_400 = 'PATCH /pastries/{name} · 400 Bad Request · schema mismatch on price';

/** Runs #118..#99 of the Tests prototype (dates moved one day forward to the demo clock). #119 is added separately. */
const HISTORY: RawRun[] = [
  { n: 118, at: '2026-11-03T07:10:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1840, res: 'passed', ops: 'ppp', score: 92 },
  { n: 117, at: '2026-11-03T04:10:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 2110, res: 'failed', ops: 'ppf', reason: PATCH_400 },
  { n: 116, at: '2026-11-02T17:05:04Z', env: 'prod', runner: 'HTTP', ms: 960, res: 'passed', ops: 'ppp' },
  { n: 115, at: '2026-11-02T10:12:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1920, res: 'passed', ops: 'ppp' },
  { n: 114, at: '2026-11-01T15:48:04Z', env: 'prod', runner: 'OPEN_API_SCHEMA', ms: 2380, res: 'passed', ops: 'ppp' },
  { n: 113, at: '2026-11-01T09:30:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 10000, res: 'timeout', ops: 'ppn',
    reason: 'No response from PATCH /pastries/{name} within the 10,000 ms timeout' },
  { n: 112, at: '2026-10-31T16:20:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1770, res: 'passed', ops: 'ppp' },
  { n: 111, at: '2026-10-30T14:02:04Z', env: 'local', runner: 'OPEN_API_SCHEMA', ms: 640, res: 'passed', ops: 'ppp' },
  { n: 110, at: '2026-10-30T11:15:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 2050, res: 'failed', ops: 'ppf', reason: PATCH_400 },
  { n: 109, at: '2026-10-29T18:40:04Z', env: 'prod', runner: 'OPEN_API_SCHEMA', ms: 2290, res: 'passed', ops: 'ppp' },
  { n: 108, at: '2026-10-29T10:05:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1990, res: 'failed', ops: 'pfp',
    reason: 'GET /pastries/{name} · Eclair Chocolat · required property "status" missing' },
  { n: 107, at: '2026-10-28T15:30:04Z', env: 'staging', runner: 'HTTP', ms: 880, res: 'passed', ops: 'ppp' },
  { n: 106, at: '2026-10-27T11:02:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1810, res: 'passed', ops: 'ppp' },
  { n: 105, at: '2026-10-26T16:44:04Z', env: 'prod', runner: 'OPEN_API_SCHEMA', ms: 2240, res: 'passed', ops: 'ppp' },
  { n: 104, at: '2026-10-25T09:58:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1860, res: 'passed', ops: 'ppp' },
  { n: 103, at: '2026-10-24T14:27:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1950, res: 'failed', ops: 'fpp',
    reason: 'GET /pastries · size=L · 500 Internal Server Error, expected 200' },
  { n: 102, at: '2026-10-23T10:40:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1700, res: 'passed', ops: 'ppp' },
  { n: 101, at: '2026-10-22T17:12:04Z', env: 'prod', runner: 'HTTP', ms: 910, res: 'passed', ops: 'ppp' },
  { n: 100, at: '2026-10-21T11:36:04Z', env: 'staging', runner: 'OPEN_API_SCHEMA', ms: 1880, res: 'passed', ops: 'ppp' },
  { n: 99, at: '2026-10-20T15:05:04Z', env: 'local', runner: 'OPEN_API_SCHEMA', ms: 590, res: 'passed', ops: 'ppp' },
];

const OUTCOME: Record<string, OperationOutcome> = { p: 'pass', f: 'fail', n: 'none' };

/** Steps of an older run, derived from its per-operation outcomes. */
function stepsFor(raw: RawRun): TestStepResult[] {
  const steps = passingSteps();
  const mark = (id: string, message: string, path = '$'): void => {
    const at = steps.findIndex((s) => s.id === id);
    const found = steps[at];
    if (found) steps[at] = { ...found, result: 'failed', violations: [{ path, message }] };
  };
  if (raw.ops[0] === 'f') mark('s3', '500 Internal Server Error, expected 200', '$.status');
  if (raw.ops[1] === 'f') mark('s6', 'required property "status" missing', '$.status');
  if (raw.ops[2] === 'f') mark('s7', 'The contract expects a number; the implementation returned a string.', '$.price');
  if (raw.ops[2] === 'n') mark('s7', 'No response within the 10,000 ms timeout.');
  return steps;
}

function toRun(raw: RawRun): TestRun {
  const steps = stepsFor(raw);
  return {
    id: String(raw.n), serviceId: 'pastry2', runner: raw.runner, environment: raw.env, endpoint: ENDPOINTS[raw.env], result: raw.res,
    startedAt: raw.at, durationMs: raw.ms, passed: steps.filter((s) => s.result === 'passed').length, total: steps.length, timeoutMs: 10_000,
    steps, reason: raw.reason, operations: [...raw.ops].map((c) => OUTCOME[c] ?? 'none'), operationLabels: OPERATION_LABELS, launchedBy: 'MA',
    contractFile: CONTRACT_FILE, ...(raw.score !== undefined ? { conformance: raw.score } : {}),
  };
}

/** API Pastry 2.0: #119 (just now, same bug as workflow run #14), #118 (passed, 92%), #117 and 18 older runs, plus one run of another service. */
export function seedTestRuns(): TestRun[] {
  const failed = failingSteps();
  const run119: TestRun = {
    id: '119', serviceId: 'pastry2', runner: 'OPEN_API_SCHEMA', environment: 'staging', endpoint: STAGING_BASE, result: 'failed',
    startedAt: '2026-11-03T09:10:04Z', durationMs: 825, passed: 6, total: 7, timeoutMs: 10_000, steps: failed, live: true,
    reason: 'PATCH /pastries/{name} · price returned as a string, a number is expected',
    operations: ['pass', 'pass', 'fail'], operationLabels: OPERATION_LABELS, launchedBy: 'MA', contractFile: CONTRACT_FILE,
    relatedWorkflowRun: { runId: RUN_IDS[14], number: 14, workflowTitle: 'Restock a pastry', stepId: 'patchPastry' },
  };
  const orders: TestRun = {
    id: '41', serviceId: 'orders', runner: 'ASYNC_API_SCHEMA', environment: 'staging',
    endpoint: 'kafka://kafka.staging.acme.io:9092/PastryordersAPI-0.1.0-pastry-orders', result: 'passed',
    startedAt: '2026-11-03T08:25:04Z', durationMs: 1210, passed: 2, total: 2, timeoutMs: 10_000, launchedBy: 'MA', operations: ['pass'],
    steps: [
      { id: 's1', operationId: 'publish-order', name: 'Validated order', method: 'SUB', path: 'pastry/orders', ms: 540, result: 'passed', violations: [] },
      { id: 's2', operationId: 'publish-order', name: 'Cancelled order', method: 'SUB', path: 'pastry/orders', ms: 610, result: 'passed', violations: [] },
    ],
  };
  return [run119, ...HISTORY.map(toRun), orders, conciergeRun(), ...OTHER_SERVICES.map(otherRun)];
}

/** Runs of other services: the latest ones the Catalogue and the Cockpit prototypes show (#17, #9, #86), and earlier passes. */
const OTHER_SERVICES: { id: string; serviceId: string; runner: TestRunner; endpoint: string; at: string; ms: number; ops: string; reason?: string }[] = [
  { id: '17', serviceId: 'movie', runner: 'GRAPHQL_SCHEMA', endpoint: 'https://movies.staging.acme.io/graphql', at: '2026-11-03T03:10:04Z', ms: 1320, ops: 'pppf',
    reason: 'addReview · response does not match the schema: rating expected Int, got Float' },
  { id: '9', serviceId: 'hellogrpc', runner: 'GRPC_PROTOBUF', endpoint: 'grpc://hello.staging.acme.io:9000', at: '2026-11-02T08:00:04Z', ms: 410, ops: 'p' },
  { id: '86', serviceId: 'pastry1', runner: 'OPEN_API_SCHEMA', endpoint: 'https://pastry.staging.acme.io/v1', at: '2026-10-31T08:00:04Z', ms: 1650, ops: 'ppf',
    reason: 'PATCH /pastries/{name} · response body does not match schema: $.price expected number, got string' },
  // Earlier passing runs of the week, so the Cockpit's "Tests · last 7 days" reads 14 passed, 7 failed.
  { id: '40', serviceId: 'orders', runner: 'ASYNC_API_SCHEMA', endpoint: 'kafka://kafka.staging.acme.io:9092/PastryordersAPI-0.1.0-pastry-orders',
    at: '2026-11-01T14:00:04Z', ms: 1180, ops: 'p' },
  { id: '16', serviceId: 'movie', runner: 'GRAPHQL_SCHEMA', endpoint: 'https://movies.staging.acme.io/graphql', at: '2026-10-31T10:30:04Z', ms: 1290, ops: 'pppp' },
  { id: '8', serviceId: 'hellogrpc', runner: 'GRPC_PROTOBUF', endpoint: 'grpc://hello.staging.acme.io:9000', at: '2026-10-30T09:00:04Z', ms: 420, ops: 'p' },
];

function otherRun(raw: (typeof OTHER_SERVICES)[number]): TestRun {
  const ops = OPERATIONS[raw.serviceId] ?? [];
  const operations = [...raw.ops].map((c) => OUTCOME[c] ?? 'none');
  const steps: TestStepResult[] = ops.map((o, i) => ({
    id: `s${i + 1}`, operationId: o.id, name: o.summary, method: o.method, path: o.path, ms: Math.round(raw.ms / ops.length),
    result: operations[i] === 'fail' ? 'failed' : 'passed',
    violations: operations[i] === 'fail' ? [{ path: '$', message: raw.reason ?? 'Response does not match the contract.' }] : [],
  }));
  const failed = operations.includes('fail');
  return {
    id: raw.id, serviceId: raw.serviceId, runner: raw.runner, environment: 'staging', endpoint: raw.endpoint, result: failed ? 'failed' : 'passed',
    startedAt: raw.at, durationMs: raw.ms, passed: steps.filter((st) => st.result === 'passed').length, total: steps.length, timeoutMs: 10_000,
    steps, reason: raw.reason, operations, operationLabels: ops.map((o) => ({ id: o.id, method: o.method, path: o.path })), launchedBy: 'MA',
  };
}

/** Run #3 of Pastry concierge 1.0 (A2A_CONFORMANCE): 13 of 15 checks passed. The Agent test screen holds its matrix. */
function conciergeRun(): TestRun {
  const step = (n: number, name: string, ms: number, failure?: string): TestStepResult => ({
    id: `s${n}`, operationId: name.split(' · ')[1] ?? name, name, method: 'A2A', path: name, ms, result: failure ? 'failed' : 'passed',
    violations: failure ? [{ path: '$.task.id', message: failure }] : [],
  });
  const steps: TestStepResult[] = [
    step(1, 'JSON-RPC · recommend-pastry', 1840), step(2, 'HTTP+JSON · recommend-pastry', 1910), step(3, 'gRPC · recommend-pastry', 1720),
    step(4, 'JSON-RPC · order-pastry', 2960),
    step(5, 'HTTP+JSON · order-pastry', 3120, 'After input-required the agent answered with a new taskId instead of resuming the same task.'),
    step(6, 'gRPC · order-pastry', 2840),
    step(7, 'JSON-RPC · track-order', 2510), step(8, 'HTTP+JSON · track-order', 2560),
    step(9, 'gRPC · track-order', 2419, 'The stream closed without lastChunk: true on artifact status.'),
    step(10, 'JSON-RPC · Agent Card', 42), step(11, 'HTTP+JSON · Agent Card', 88), step(12, 'gRPC · Agent Card', 131),
  ];
  return {
    id: '3', serviceId: 'concierge', runner: 'A2A_CONFORMANCE', environment: 'staging', endpoint: 'https://concierge.staging.acme.io/.well-known/agent-card.json',
    result: 'failed', startedAt: '2026-11-03T08:10:04Z', durationMs: 27_300, passed: 13, total: 15, timeoutMs: 15_000, steps, launchedBy: 'MA',
    reason: 'order-pastry · HTTP+JSON resumes input-required on a new task', operations: ['pass', 'fail', 'fail'],
    operationLabels: [{ id: 'recommend-pastry', method: 'SKILL', path: 'recommend-pastry' }, { id: 'order-pastry', method: 'SKILL', path: 'order-pastry' }, { id: 'track-order', method: 'SKILL', path: 'track-order' }],
  };
}
