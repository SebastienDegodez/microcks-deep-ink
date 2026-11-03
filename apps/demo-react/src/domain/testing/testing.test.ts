import { describe, expect, it } from 'vitest';
import {
  buildCiSnippet,
  buildContractDiff,
  ciDiffLegend,
  diffCiLines,
  filterRuns,
  parseTimeout,
  runConformance,
  validateEndpoint,
  validateTestForm,
  type CiSnippetInput,
  type TestRunSummary,
  type TestStepResult,
} from './index';

const base: CiSnippetInput = {
  apiRef: 'API Pastry:2.0', apiName: 'API Pastry', endpoint: 'https://pastry.staging.acme.io/v2', runner: 'OPEN_API_SCHEMA', waitSec: 10,
  secret: '', allOperations: true, selectedOperations: [], headers: [], isEvent: false,
};

describe('CI snippet', () => {
  it('writes the default CLI command', () => {
    const lines = buildCiSnippet(base, 'cli');
    expect(lines[0]).toBe("microcks test 'API Pastry:2.0' https://pastry.staging.acme.io/v2 OPEN_API_SCHEMA \\");
    expect(lines.at(-1)).toBe('  --waitFor=10sec');
    expect(lines.join('\n')).not.toContain('secretName');
  });

  it('mirrors secret, operations filter and headers, and marks the changed lines', () => {
    const changed = buildCiSnippet(
      { ...base, secret: 'pastry-staging-oauth', allOperations: false, selectedOperations: ['GET /pastries'], headers: [{ scope: 'globals', name: ' x-api-key ', values: 'k1' }] },
      'cli',
    );
    expect(changed).toContain('  --secretName=pastry-staging-oauth \\');
    expect(changed).toContain(`  --filteredOperations='["GET /pastries"]' \\`);
    expect(changed).toContain(`  --operationsHeaders='{"globals":[{"name":"x-api-key","values":"k1"}]}' \\`);
    const marked = diffCiLines(changed, buildCiSnippet(base, 'cli'));
    expect(marked.filter((l) => l.changed)).toHaveLength(3);
    expect(ciDiffLegend(3, 'API Pastry 2.0')).toBe('3 lines differ from the default configuration.');
  });

  it('writes the GitHub Actions and Tekton formats, with a placeholder for an empty endpoint', () => {
    expect(buildCiSnippet(base, 'gha')).toContain('    keycloakClientId: ${{ secrets.MICROCKS_SERVICE_ACCOUNT }}');
    expect(buildCiSnippet({ ...base, endpoint: ' ' }, 'tekton')).toContain('      value: <test-endpoint>');
    expect(buildCiSnippet({ ...base, isEvent: true, headers: [{ scope: 'globals', name: 'a', values: 'b' }] }, 'cli').join('')).not.toContain('operationsHeaders');
  });
});

describe('test form validation', () => {
  const values = { endpoint: 'https://pastry.staging.acme.io/v2', timeout: '10000', selectedOperations: ['get-list'], oauth: false, clientSecret: '' };

  it('accepts a valid form', () => {
    expect(validateTestForm('REST', values)).toEqual({});
  });

  it('checks the endpoint by service type', () => {
    expect(validateEndpoint('REST', 'ftp://x')).toBe('Use an http:// or https:// URL.');
    expect(validateEndpoint('EVENT', 'https://x')).toBe('Use a broker URL such as kafka://host:9092/topic.');
    expect(validateEndpoint('EVENT', 'kafka://host:9092/t')).toBeUndefined();
    expect(validateEndpoint('GRPC', 'grpc://host:9000')).toBeUndefined();
    expect(validateEndpoint('REST', ' ')).toBe('A test endpoint is required.');
  });

  it('reports timeout, operations and OAuth2 secret errors', () => {
    expect(validateTestForm('REST', { ...values, timeout: '50', selectedOperations: [], oauth: true })).toEqual({
      timeout: 'Enter a value between 1,000 and 30,000 ms.',
      operations: 'Select at least one operation to test.',
      clientSecret: 'The OAuth2 client secret is required.',
    });
    expect(parseTimeout('30000')).toBe(30000);
    expect(parseTimeout('30001')).toBeNull();
    expect(parseTimeout('abc')).toBeNull();
  });
});

describe('contract diff', () => {
  const contract = [
    { key: 'name', schema: '{ type: string }' },
    { key: 'price', schema: '{ type: number }' },
  ];

  it('flags the price that is a string where the contract says number', () => {
    const step: Pick<TestStepResult, 'payload' | 'contract' | 'violations'> = {
      payload: { name: 'Eclair Chocolat', price: '2.6' }, contract, violations: [{ path: '$.price', message: 'string' }],
    };
    const diff = buildContractDiff(step);
    expect(diff.badCount).toBe(1);
    expect(diff.right.filter((r) => r.bad).map((r) => r.text.trim())).toEqual(['"price": "2.6"']);
    expect(diff.left.filter((r) => r.bad)[0]?.text).toContain('{ type: number }');
    expect(diff.left).toHaveLength(diff.right.length);
  });

  it('shows the first item of an array and counts the others', () => {
    const diff = buildContractDiff({ payload: [{ name: 'a', price: 1 }, { name: 'b', price: 2 }], contract, violations: [] });
    expect(diff.right.some((r) => r.text.includes('+ 1 more item, also valid'))).toBe(true);
    expect(diff.badCount).toBe(0);
  });
});

describe('run helpers', () => {
  const run = (id: string, result: TestRunSummary['result'], runner = 'OPEN_API_SCHEMA', environment = 'staging'): TestRunSummary => ({
    id, serviceId: 'pastry2', runner: runner as TestRunSummary['runner'], environment: environment as TestRunSummary['environment'], endpoint: '', result,
    startedAt: '', durationMs: 0, passed: 6, total: 7,
  });

  it('filters by result (timeouts count as failed), runner and endpoint', () => {
    const runs = [run('1', 'passed'), run('2', 'failed'), run('3', 'timeout', 'HTTP'), run('4', 'passed', 'HTTP', 'prod')];
    expect(filterRuns(runs, { result: 'failed' }).map((r) => r.id)).toEqual(['2', '3']);
    expect(filterRuns(runs, { runner: 'HTTP' }).map((r) => r.id)).toEqual(['3', '4']);
    expect(filterRuns(runs, { environment: 'prod', result: 'all' }).map((r) => r.id)).toEqual(['4']);
    expect(runConformance(run('x', 'passed'))).toBe(86);
  });
});

import { buildRunnerLog, elapsedMs, type TestRun } from './index';

describe('runner log', () => {
  const step = (n: number, result: 'passed' | 'failed'): TestStepResult => ({
    id: `s${n}`, operationId: 'op', name: `Step ${n}`, method: 'GET', path: `/p${n}`, ms: 30, result,
    violations: result === 'failed' ? [{ path: '$.price', message: 'string', raw: 'raw message' }] : [],
  });
  const run: TestRun = {
    id: '119', serviceId: 'pastry2', runner: 'OPEN_API_SCHEMA', environment: 'staging', endpoint: 'https://x/v2', result: 'failed', startedAt: '2026-11-03T09:10:04Z',
    durationMs: 0, passed: 1, total: 2, timeoutMs: 10_000, steps: [step(1, 'passed'), step(2, 'failed')], operationLabels: [{ id: 'op', method: 'GET', path: '/p' }],
  };

  it('shows a waiting line while a step runs, and the verdict when done', () => {
    const running = buildRunnerLog(run, 1, false);
    expect(running.at(-1)).toMatchObject({ level: 'WAIT' });
    expect(running[0]?.time).toBe('09:10:04.112');
    const done = buildRunnerLog(run, 2, true);
    expect(done.filter((l) => l.level === 'FAIL').map((l) => l.message)).toContain('  $.price raw message');
    expect(done.at(-1)?.message).toBe('Result: FAILED');
    expect(elapsedMs(run, 2)).toBe(140 + 2 * 90);
  });
});
