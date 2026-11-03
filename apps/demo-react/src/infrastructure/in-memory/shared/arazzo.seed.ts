import type {
  Action,
  ArazzoDocument,
  Criterion,
  MockCoherenceIssue,
  RunOptions,
  RunOrigin,
  RunTarget,
  Session,
  SessionCall,
  Step,
  StepParameter,
  StepResult,
  Workflow,
  WorkflowExample,
  WorkflowRun,
} from '@/domain/arazzo';
import { baggage } from '@/domain/arazzo';
import { ARAZZO_DOC, MICROCKS_BASE, MOCK_BASE, RUN_IDS, SESSION_ID, STAGING_BASE } from './seed-ids';

/* -------------------------------------------------------------------------------------------------
 * Arazzo seed shared by every feature (Service "Used by workflows", Traces baggage, Cockpit...).
 * Facts come from the maintainer's POC: arazzo 1.1.0, actions = retry and end only (no goto),
 * run #14 of restock-pastry fails at patchPastry because `price` comes back as the STRING "3.9".
 * WP8 owns the adapters that serve it; the definitions live here so all features agree.
 * ------------------------------------------------------------------------------------------------- */

const simple = (condition: string): Criterion => ({ type: 'simple', condition });
const OK = [simple('$statusCode == 200')];

interface StepInit {
  stepId: string;
  sourceName: string;
  operationId: string;
  method: string;
  path: string;
  description: string;
  parameters?: StepParameter[];
  requestBody?: string;
  successCriteria?: Criterion[];
  onSuccess?: Action[];
  onFailure?: Action[];
  outputs?: { name: string; expression: string }[];
  dependsOn?: string[];
}

const step = (init: StepInit): Step => ({
  parameters: [],
  successCriteria: OK,
  onSuccess: [],
  onFailure: [],
  outputs: [],
  ...init,
});

const nameParam: StepParameter = { name: 'name', in: 'path', value: '$steps.listPastries.outputs.firstName' };

export const RESTOCK_STEPS: Step[] = [
  step({
    stepId: 'listPastries', sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries',
    description: 'List the pastries of the requested size and keep the first one.',
    parameters: [{ name: 'size', in: 'query', value: '$inputs.size' }],
    outputs: [{ name: 'firstName', expression: '$response.body#/0/name' }],
  }),
  step({
    stepId: 'getPastry', sourceName: 'apiPastry', operationId: 'GetPastryByName', method: 'GET', path: '/pastries/{name}',
    description: 'Read the first pastry to get its current price and status.',
    parameters: [nameParam],
    onSuccess: [{ type: 'end', name: 'alreadyAvailable', criteria: [simple("$response.body#/status == 'available'")] }],
    outputs: [
      { name: 'oldPrice', expression: '$response.body#/price' },
      { name: 'status', expression: '$response.body#/status' },
    ],
  }),
  step({
    stepId: 'patchPastry', sourceName: 'apiPastry', operationId: 'PatchPastry', method: 'PATCH', path: '/pastries/{name}',
    description: 'Make the pastry available again at the new price.',
    parameters: [nameParam],
    requestBody: '{"price": "{$inputs.newPrice}", "status": "available"}',
    onFailure: [{ type: 'retry', name: 'retryPatch', retryAfter: 1, retryLimit: 2 }],
    outputs: [{ name: 'newPrice', expression: '$response.body#/price' }],
  }),
  step({
    stepId: 'verifyPastry', sourceName: 'apiPastry', operationId: 'GetPastryByName', method: 'GET', path: '/pastries/{name}',
    description: 'Read the pastry again and check it is now available.',
    parameters: [nameParam],
    successCriteria: [
      simple('$statusCode == 200'),
      simple("$response.body#/status == 'available'"),
      { type: 'regex', context: '$response.body#/status', condition: '^available$' },
    ],
  }),
];

const list = (id: string, size: string) =>
  step({
    stepId: id, sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries',
    description: `List the ${size} pastries.`,
    parameters: [{ name: 'size', in: 'query', value: size }],
    outputs: [{ name: 'count', expression: '$response.body#/length' }],
  });

export const CHECK_MENU_STEPS: Step[] = [
  list('listSmall', 'S'),
  list('listMedium', 'M'),
  list('listLarge', 'L'),
  step({
    stepId: 'compareSizes', sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries',
    description: 'Compare the three sizes once they are all listed.',
    dependsOn: ['listSmall', 'listMedium', 'listLarge'],
  }),
];

const mockUrl = (doc: 'pastry' | 'beer', workflowId: string) =>
  doc === 'pastry'
    ? `${MICROCKS_BASE}/arazzo/Pastry%20workflows/1.2.0/${workflowId}`
    : `${MICROCKS_BASE}/arazzo/Beer%20checkout/0.3.0/${workflowId}`;

const RUNNABLE = { runnable: true } as const;

export const WORKFLOWS: Workflow[] = [
  {
    workflowId: 'restock-pastry', documentId: 'pastry', summary: 'Restock a pastry',
    inputs: [{ name: 'size', type: 'string', example: 'M' }, { name: 'newPrice', type: 'number', example: '3.9' }],
    steps: RESTOCK_STEPS,
    outputs: [
      { name: 'pastryName', expression: '$steps.listPastries.outputs.firstName' },
      { name: 'oldPrice', expression: '$steps.getPastry.outputs.oldPrice' },
      { name: 'newPrice', expression: '$steps.patchPastry.outputs.newPrice' },
    ],
    mockUrl: mockUrl('pastry', 'restock-pastry'), runnability: RUNNABLE,
  },
  {
    workflowId: 'order-pastry', documentId: 'pastry', summary: 'Order a pastry',
    inputs: [{ name: 'name', type: 'string' }, { name: 'quantity', type: 'integer' }],
    steps: [
      step({ stepId: 'getPastry', sourceName: 'apiPastry', operationId: 'GetPastryByName', method: 'GET', path: '/pastries/{name}',
        description: 'Read the pastry to order.', parameters: [{ name: 'name', in: 'path', value: '$inputs.name' }] }),
      step({ stepId: 'publishOrder', sourceName: 'pastryOrders', operationId: 'publishOrder', method: 'PUBLISH', path: 'pastry-orders',
        description: 'Publish the order on the orders channel.' }),
      step({ stepId: 'awaitValidation', sourceName: 'pastryOrders', operationId: 'awaitValidation', method: 'SUBSCRIBE', path: 'pastry-orders-validated',
        description: 'Wait for the order to be validated.' }),
    ],
    outputs: [],
    mockUrl: mockUrl('pastry', 'order-pastry'),
    runnability: {
      runnable: false, reason: 'asyncapi-steps',
      message: 'Workflow order-pastry cannot run yet: its steps publishOrder and awaitValidation exchange messages on an AsyncAPI source',
    },
  },
  {
    workflowId: 'compare-prices', documentId: 'pastry', summary: 'Compare v1 / v2 prices',
    inputs: [{ name: 'name', type: 'string' }],
    steps: [
      step({ stepId: 'getV1', sourceName: 'apiPastryV1', operationId: 'GetPastryByName', method: 'GET', path: '/pastries/{name}',
        description: 'Read the pastry in API Pastry 1.0.', parameters: [{ name: 'name', in: 'path', value: '$inputs.name' }] }),
      step({ stepId: 'getV2', sourceName: 'apiPastry', operationId: 'GetPastryByName', method: 'GET', path: '/pastries/{name}',
        description: 'Read the pastry in API Pastry 2.0.', parameters: [{ name: 'name', in: 'path', value: '$inputs.name' }] }),
      step({ stepId: 'checkV2Listing', sourceName: 'apiPastry', operationId: 'GetPastries', method: 'GET', path: '/pastries',
        description: 'Check the pastry is listed in version 2.0.' }),
    ],
    outputs: [], mockUrl: mockUrl('pastry', 'compare-prices'), runnability: RUNNABLE,
  },
  {
    workflowId: 'check-menu', documentId: 'pastry', summary: 'Check the menu sizes',
    inputs: [], steps: CHECK_MENU_STEPS, outputs: [], mockUrl: mockUrl('pastry', 'check-menu'), runnability: RUNNABLE,
  },
  {
    workflowId: 'checkout-beer', documentId: 'beer', summary: 'Check out a beer',
    inputs: [{ name: 'beerName', type: 'string' }, { name: 'quantity', type: 'integer' }],
    steps: [
      step({ stepId: 'findBeer', sourceName: 'beerCatalog', operationId: 'FindBeer', method: 'GET', path: '/beers', description: 'Find the beer.' }),
      step({ stepId: 'getBeer', sourceName: 'beerCatalog', operationId: 'GetBeer', method: 'GET', path: '/beers/{name}', description: 'Read the beer.' }),
      step({ stepId: 'reserveBeer', sourceName: 'beerCatalog', operationId: 'ReserveBeer', method: 'POST', path: '/beers/{name}/reserve', description: 'Reserve the beer.' }),
    ],
    outputs: [], mockUrl: mockUrl('beer', 'checkout-beer'),
    runnability: { runnable: false, reason: 'source-not-linked', message: 'Workflow checkout-beer cannot run until beerCatalog is linked' },
  },
];

export const DOCUMENTS: ArazzoDocument[] = [
  {
    ...ARAZZO_DOC.pastry,
    title: 'Pastry workflows',
    origin: 'Synced 12 min ago from GitHub',
    sources: [
      { name: 'apiPastry', type: 'openapi', url: './apipastry-2.0-openapi.yaml', link: { status: 'linked', serviceId: 'pastry2', protocol: 'REST', operationsFound: '3 of 3 found' } },
      { name: 'apiPastryV1', type: 'openapi', url: './apipastry-1.0-openapi.yaml', link: { status: 'linked', serviceId: 'pastry1', protocol: 'REST', operationsFound: '1 of 1 found' } },
      { name: 'pastryOrders', type: 'asyncapi', url: './pastry-orders-0.1.0-asyncapi.yaml', link: { status: 'linked', serviceId: 'orders', protocol: 'EVENT', operationsFound: '2 of 2 found' } },
    ],
    workflowIds: ['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu'],
    importIssues: [],
  },
  {
    ...ARAZZO_DOC.beer,
    title: 'Beer checkout',
    origin: 'Uploaded from a file 6 d ago by MA',
    sources: [
      { name: 'beerCatalog', type: 'openapi', url: './beer-catalog-1.0-openapi.yaml', link: { status: 'not-linked', expectedFile: 'beer-catalog-1.0-openapi.yaml' } },
    ],
    workflowIds: ['checkout-beer'],
    importIssues: [],
  },
];

/* ---------------------------------------------------------------------------------------------- runs */

const SCHEMA_MSG =
  '/price does not match the Pastry schema: instance type (string) does not match any allowed primitive type (allowed: ["integer","number"])';

const held = (condition: string, evaluation: string, kind: 'simple' | 'regex' = 'simple') => ({ condition, kind, evaluation, held: true });
const status200 = held('$statusCode == 200', '$statusCode = 200');
const attempt = (n: number, ms: number, when: string, httpStatus = 200) => ({ n, httpStatus, ms, when });
const NO_SCHEMA = { state: 'off' as const, ref: '', message: 'Off for this run: the step is judged on its success criteria only.' };

function passedStep(runId: string, workflowId: string, s: Step, base: string, ms: number, outputs: Record<string, unknown> = {}, validate = false): StepResult {
  return {
    stepId: s.stepId, status: 'passed', attempts: [attempt(1, ms, 'first call')],
    request: { method: s.method, url: `${base}${s.path}`, params: Object.fromEntries(s.parameters.map((p) => [p.name, p.value])) },
    criteria: s.successCriteria.map((c) => held(c.condition, `${c.type === 'regex' ? c.context : c.condition.split(' ')[0]} = 200`, c.type)),
    schema: validate ? { state: 'pass', ref: `${s.operationId} · 200 · application/json`, message: 'The response conforms to its schema.' } : NO_SCHEMA,
    outputs,
    flow: { kind: 'next', title: 'Next step', text: 'The step passed, so the run continues with the next step.' },
    baggage: baggage(runId, workflowId, s.stepId, 1),
  };
}

function notRun(runId: string, workflowId: string, s: Step): StepResult {
  return {
    stepId: s.stepId, status: 'not-run', attempts: [], criteria: [], schema: NO_SCHEMA, outputs: {},
    flow: { kind: 'next', title: '', text: '' }, baggage: baggage(runId, workflowId, s.stepId, 1),
  };
}

const [LIST, GET, PATCH, VERIFY] = RESTOCK_STEPS as [Step, Step, Step, Step];
const MOCK_OPTS = (example: string, inputs: Record<string, unknown>): RunOptions => ({ example, inputs, timeoutMs: 10_000, validateSchemas: false });

function restockRun(init: {
  number: number; id: string; startedAt: string; origin: RunOrigin; target: RunTarget; options: RunOptions;
  status: 'SUCCESS' | 'FAILURE'; steps: StepResult[]; outputs?: Record<string, unknown>;
  coherence?: MockCoherenceIssue[]; relatedTestRunId?: string;
}): WorkflowRun {
  return { documentId: 'pastry', workflowId: 'restock-pastry', outputs: {}, coherence: [], ...init };
}

/** Run #14: implementations (staging), schema validation on. patchPastry fails 3 times on `price`. */
function run14(): WorkflowRun {
  const id = RUN_IDS[14];
  const base = STAGING_BASE;
  const patch: StepResult = {
    stepId: 'patchPastry', status: 'failed',
    attempts: [attempt(1, 66, 'first call'), attempt(2, 58, 'after 1 s'), attempt(3, 61, 'after 1 s')],
    request: { method: 'PATCH', url: `${base}/pastries/Eclair%20Cafe`, params: { name: 'Eclair Cafe' }, body: '{"price": 3.9, "status": "available"}' },
    response: {
      meta: '200 OK · application/json',
      lines: [
        { text: '{' },
        { text: '  "name": "Eclair Cafe",' },
        { text: '  "description": "Delicious Coffee Eclair, not caloric at all",' },
        { text: '  "size": "M",' },
        { text: '  "price": "3.9",', bad: true, note: 'schema: number' },
        { text: '  "status": "available"' },
        { text: '}' },
      ],
    },
    criteria: [status200],
    schema: { state: 'fail', ref: 'PatchPastry · 200 · application/json · Pastry', message: SCHEMA_MSG },
    outputs: {},
    flow: {
      kind: 'stop', title: 'Failed after 3 attempts: the run ends here',
      text: 'Each attempt failed on schema validation although its success criteria held, so onFailure retry applied twice (retryAfter 1 s, retryLimit 2). After attempt 3 the retry limit is reached: the run ends with FAILURE and verifyPastry is not run.',
    },
    baggage: baggage(id, 'restock-pastry', 'patchPastry', 3),
  };
  return restockRun({
    number: 14, id, startedAt: '2026-11-03T09:10:04Z', origin: { kind: 'ui' }, target: { kind: 'implementations', baseUrls: { apiPastry: base } },
    options: { example: 'restock-eclair', inputs: { size: 'M', newPrice: 3.9 }, secret: 'pastry-staging-oauth', timeoutMs: 10_000, validateSchemas: true },
    status: 'FAILURE', relatedTestRunId: '119',
    steps: [
      passedStep(id, 'restock-pastry', LIST, base, 41, { firstName: 'Eclair Cafe' }, true),
      passedStep(id, 'restock-pastry', GET, base, 29, { oldPrice: 2.4, status: 'unknown' }, true),
      patch,
      notRun(id, 'restock-pastry', VERIFY),
    ],
  });
}

function sessionRun13(): WorkflowRun {
  const id = RUN_IDS[13];
  const patch: StepResult = {
    ...passedStep(id, 'restock-pastry', PATCH, MOCK_BASE, 0, {}),
    status: 'failed',
    attempts: [attempt(1, 0, 'call #4')],
    flow: { kind: 'stop', title: 'Data not taken from an earlier step', text: 'patchPastry called with name=Millefeuille, expected $steps.listPastries.outputs.firstName = Eclair Cafe' },
  };
  return restockRun({
    number: 13, id, startedAt: '2026-11-03T07:08:04Z', origin: { kind: 'session', sessionId: SESSION_ID, app: 'checkout-web' },
    target: { kind: 'mocks' }, options: { inputs: { size: 'M', newPrice: 3.9 }, timeoutMs: 10_000, validateSchemas: false },
    status: 'FAILURE',
    steps: [
      passedStep(id, 'restock-pastry', LIST, MOCK_BASE, 0, { firstName: 'Eclair Cafe' }),
      passedStep(id, 'restock-pastry', GET, MOCK_BASE, 0, { oldPrice: 2.4, status: 'unknown' }),
      patch,
      passedStep(id, 'restock-pastry', VERIFY, MOCK_BASE, 0),
    ],
  });
}

function mocksSuccess(number: number, id: string, startedAt: string, origin: RunOrigin, example: string): WorkflowRun {
  return restockRun({
    number, id, startedAt, origin, target: { kind: 'mocks' }, options: MOCK_OPTS(example, { size: 'M', newPrice: 3.9 }), status: 'SUCCESS',
    steps: [
      passedStep(id, 'restock-pastry', LIST, MOCK_BASE, 6, { firstName: 'Eclair Cafe' }),
      passedStep(id, 'restock-pastry', GET, MOCK_BASE, 5, { oldPrice: 2.4, status: 'unknown' }),
      passedStep(id, 'restock-pastry', PATCH, MOCK_BASE, 7, { newPrice: 3.9 }),
      passedStep(id, 'restock-pastry', VERIFY, MOCK_BASE, 5),
    ],
    outputs: { pastryName: 'Eclair Cafe', oldPrice: 2.4, newPrice: 3.9 },
  });
}

function run15(): WorkflowRun {
  const id = RUN_IDS[15];
  const get: StepResult = {
    ...passedStep(id, 'restock-pastry', GET, MOCK_BASE, 5, { oldPrice: 4.4, status: 'available' }),
    flow: { kind: 'end', title: 'onSuccess end applies: the run ends here', text: "Its criterion $response.body#/status == 'available' holds: nothing to restock. The run ends with SUCCESS; patchPastry and verifyPastry are not run." },
  };
  return restockRun({
    number: 15, id, startedAt: '2026-11-03T09:14:37Z', origin: { kind: 'ui' }, target: { kind: 'mocks' },
    options: MOCK_OPTS('already-available', { size: 'L' }), status: 'SUCCESS',
    steps: [passedStep(id, 'restock-pastry', LIST, MOCK_BASE, 6, { firstName: 'Millefeuille' }), get, notRun(id, 'restock-pastry', PATCH), notRun(id, 'restock-pastry', VERIFY)],
    outputs: { pastryName: 'Millefeuille' },
  });
}

function run16(): WorkflowRun {
  const id = RUN_IDS[16];
  const get: StepResult = {
    stepId: 'getPastry', status: 'failed', attempts: [attempt(1, 4, 'first call', 400)],
    request: { method: 'GET', url: `${MOCK_BASE}/pastries/Tarte%20Tatin`, params: { name: 'Tarte Tatin' } },
    response: { meta: '400 Bad Request', lines: [] },
    criteria: [{ condition: '$statusCode == 200', kind: 'simple', evaluation: '$statusCode = 400', held: false }],
    schema: NO_SCHEMA, outputs: {},
    flow: { kind: 'stop', title: 'No onFailure action: the run ends here', text: 'getPastry declares no onFailure action, so the run ends with FAILURE. patchPastry and verifyPastry are not run.' },
    baggage: baggage(id, 'restock-pastry', 'getPastry', 1),
  };
  return restockRun({
    number: 16, id, startedAt: '2026-11-03T09:16:52Z', origin: { kind: 'ui' }, target: { kind: 'mocks' },
    options: { inputs: { size: 'S', newPrice: 4.2 }, timeoutMs: 10_000, validateSchemas: false }, status: 'FAILURE',
    steps: [passedStep(id, 'restock-pastry', LIST, MOCK_BASE, 6, { firstName: 'Tarte Tatin' }), get, notRun(id, 'restock-pastry', PATCH), notRun(id, 'restock-pastry', VERIFY)],
    coherence: [{
      stepId: 'getPastry', operationId: 'GetPastryByName',
      missing: 'an example of GetPastryByName for name=Tarte Tatin',
      copilotHint: 'Tarte Tatin',
    }],
  });
}

function checkMenuRun(): WorkflowRun {
  const id = RUN_IDS.checkMenu3;
  return {
    id, number: 3, documentId: 'pastry', workflowId: 'check-menu', origin: { kind: 'ui' }, target: { kind: 'mocks' },
    options: { inputs: {}, timeoutMs: 10_000, validateSchemas: false }, status: 'SUCCESS', startedAt: '2026-10-30T08:00:04Z',
    steps: CHECK_MENU_STEPS.map((s) => passedStep(id, 'check-menu', s, MOCK_BASE, 6)), outputs: {}, coherence: [],
  };
}

export function seedRuns(): WorkflowRun[] {
  return [
    run14(),
    sessionRun13(),
    mocksSuccess(12, RUN_IDS[12], '2026-11-02T16:42:04Z', { kind: 'ui' }, 'restock-eclair'),
    mocksSuccess(11, RUN_IDS[11], '2026-11-01T10:15:04Z', { kind: 'mock-url' }, 'restock-eclair'),
    run15(),
    run16(),
    checkMenuRun(),
  ];
}

/* ---------------------------------------------------------------------------------------- sessions */

const call = (n: number, method: string, path: string, httpStatus: number, stepId: string, dataText: string, extra: Partial<SessionCall> = {}): SessionCall => ({
  n, method, path, httpStatus, stepId,
  contract: { state: 'pass', text: 'conforms' },
  dataPassing: { state: 'pass', text: dataText },
  ...extra,
});

export function seedSessions(): Session[] {
  return [
    {
      id: SESSION_ID, app: 'checkout-web · saga tests', documentId: 'pastry', workflowId: 'restock-pastry', state: 'closed',
      openedAt: '2026-11-03T07:05:04Z', inputs: { size: 'M', newPrice: 3.9 },
      calls: [
        call(1, 'GET', '/pastries?size=M', 200, 'listPastries', 'size from the inputs'),
        call(2, 'GET', '/pastries/Eclair%20Cafe', 200, 'getPastry', 'name from listPastries'),
        call(3, 'GET', '/pastries?size=XL', 400, 'unexpected', '—', {
          contract: { state: 'fail', text: 'size XL is not one of S, M, L' }, dataPassing: { state: 'off', text: '—' },
        }),
        call(4, 'PATCH', '/pastries/Millefeuille', 200, 'patchPastry', 'name=Millefeuille, expected Eclair Cafe', {
          dataPassing: { state: 'fail', text: 'name=Millefeuille, expected Eclair Cafe' },
        }),
        call(5, 'GET', '/pastries/Eclair%20Cafe', 200, 'verifyPastry', 'name from listPastries'),
      ],
      verification: {
        result: 'FAILURE', runNumber: 13,
        problems: [
          { lead: 'Step 3, patchPastry:', text: 'data not taken from an earlier step: patchPastry called with name=Millefeuille, expected $steps.listPastries.outputs.firstName = Eclair Cafe' },
          { lead: 'Call #3, GET /pastries?size=XL:', text: 'unexpected call `GetPastries` after `getPastry`' },
        ],
      },
    },
    {
      id: 's-2b91e04d', app: 'checkout-web · compensation test', documentId: 'pastry', workflowId: 'restock-pastry', state: 'open',
      openedAt: '2026-11-03T09:04:04Z', inputs: { size: 'M', newPrice: 3.9 },
      failureInjection: { stepId: 'patchPastry', example: 'Eclair Cafe · out of stock' },
      calls: [
        call(1, 'GET', '/pastries?size=M', 200, 'listPastries', 'size from the inputs'),
        call(2, 'GET', '/pastries/Eclair%20Cafe', 200, 'getPastry', 'name from listPastries'),
      ],
    },
    {
      id: 's-c4d07a18', app: 'checkout-web · saga tests', documentId: 'pastry', workflowId: 'restock-pastry', state: 'closed',
      openedAt: '2026-11-02T11:20:04Z', inputs: { size: 'M', newPrice: 3.9 },
      calls: [
        call(1, 'GET', '/pastries?size=M', 200, 'listPastries', 'size from the inputs'),
        call(2, 'GET', '/pastries/Eclair%20Cafe', 200, 'getPastry', 'name from listPastries'),
        call(3, 'PATCH', '/pastries/Eclair%20Cafe', 200, 'patchPastry', 'name from listPastries'),
        call(4, 'GET', '/pastries/Eclair%20Cafe', 200, 'verifyPastry', 'name from listPastries'),
      ],
      verification: { result: 'SUCCESS', runNumber: 10, problems: [] },
    },
  ];
}

export const EXAMPLES: WorkflowExample[] = [
  {
    id: 'restock-eclair', workflowId: 'restock-pastry',
    description: 'Eclair Cafe is not available: the workflow restocks it at 3.9.',
    inputs: { size: 'M', newPrice: 3.9 },
    steps: [
      { stepId: 'listPastries', status: 200, outputs: { firstName: 'Eclair Cafe' } },
      { stepId: 'getPastry', status: 200 },
      { stepId: 'patchPastry', status: 200 },
      { stepId: 'verifyPastry', status: 200 },
    ],
    outputs: { newPrice: 3.9 },
  },
  {
    id: 'already-available', workflowId: 'restock-pastry',
    description: 'Millefeuille is already available: the end action of getPastry stops the run, with success.',
    inputs: { size: 'L' },
    steps: [
      { stepId: 'listPastries', status: 200, outputs: { firstName: 'Millefeuille' } },
      { stepId: 'getPastry', status: 200, outputs: { status: 'available' } },
    ],
    stopsAt: 'getPastry',
    outputs: { pastryName: 'Millefeuille' },
  },
];
