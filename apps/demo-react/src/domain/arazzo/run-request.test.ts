import { describe, expect, it } from 'vitest';
import { baggage, parseBaggage } from './baggage';
import { matchesRunKind } from './run-filter';
import { EXAMPLE_BASE_URL, validateRunRequest, type RunRequestForm } from './run-request';

const form = (over: Partial<RunRequestForm> = {}): RunRequestForm => ({
  workflowId: 'restock-pastry',
  target: 'implementations',
  sources: ['apiPastry'],
  baseUrls: { apiPastry: EXAMPLE_BASE_URL },
  inputs: [
    { name: 'size', type: 'string', value: 'M' },
    { name: 'newPrice', type: 'number', value: '3.9' },
  ],
  timeoutMs: '10000',
  ...over,
});

describe('validateRunRequest', () => {
  it('accepts the run #14 form', () => {
    expect(validateRunRequest(form())).toEqual([]);
  });

  it('asks for a dot as decimal separator when newPrice is "3,9"', () => {
    const errors = validateRunRequest(form({ inputs: [{ name: 'newPrice', type: 'number', value: '3,9' }] }));
    expect(errors).toEqual([{ field: 'input.newPrice', message: 'Use a dot as decimal separator (3.9): newPrice is a JSON number.' }]);
  });

  it('rejects other non-numeric values', () => {
    const errors = validateRunRequest(form({ inputs: [{ name: 'newPrice', type: 'number', value: 'abc' }] }));
    expect(errors[0]?.message).toBe('newPrice must be a number.');
  });

  it('requires an absolute http(s) base URL for implementations only', () => {
    expect(validateRunRequest(form({ baseUrls: { apiPastry: '' } }))[0]).toEqual({
      field: 'baseUrl.apiPastry',
      message: 'Enter the base URL of the apiPastry implementation.',
    });
    expect(validateRunRequest(form({ baseUrls: { apiPastry: 'pastry.staging.acme.io' } }))[0]?.message).toBe(
      `Enter an absolute http(s) URL, such as ${EXAMPLE_BASE_URL}.`,
    );
    expect(validateRunRequest(form({ target: 'mocks', baseUrls: {} }))).toEqual([]);
  });

  it('checks base URLs per source for the mixed target', () => {
    const errors = validateRunRequest(
      form({ target: 'mixed', sources: ['apiPastry', 'apiPastryV1'], perSource: { apiPastry: 'mock', apiPastryV1: 'implementation' }, baseUrls: {} }),
    );
    expect(errors.map((e) => e.field)).toEqual(['baseUrl.apiPastryV1']);
  });

  it('requires a whole timeout of at least 1 ms', () => {
    expect(validateRunRequest(form({ timeoutMs: '0' }))[0]?.field).toBe('timeoutMs');
    expect(validateRunRequest(form({ timeoutMs: '1.5' }))[0]?.field).toBe('timeoutMs');
    expect(validateRunRequest(form({ timeoutMs: '30000' }))).toEqual([]);
  });

  it('reports a workflow that cannot run, first', () => {
    const errors = validateRunRequest(form({ notRunnableMessage: 'Workflow order-pastry cannot run yet', timeoutMs: '' }));
    expect(errors.map((e) => e.field)).toEqual(['workflowId', 'timeoutMs']);
  });
});

describe('baggage', () => {
  it('has the microcks-arazzo keys in order', () => {
    expect(baggage('6729a1d27e4c0b5f93a8c214', 'restock-pastry', 'patchPastry', 3)).toBe(
      'microcks-arazzo-run=6729a1d27e4c0b5f93a8c214,microcks-arazzo-workflow=restock-pastry,microcks-arazzo-step=patchPastry,microcks-arazzo-attempt=3',
    );
  });

  it('parses back', () => {
    expect(parseBaggage(baggage('r1', 'wf', 's', 2))).toEqual({ runId: 'r1', workflowId: 'wf', stepId: 's', attempt: 2 });
    expect(parseBaggage('foo=bar')).toBeNull();
  });
});

describe('matchesRunKind', () => {
  it('maps the Workflows target filter onto target and origin', () => {
    const ui = { origin: { kind: 'ui' }, target: { kind: 'mocks' } } as const;
    const mockUrl = { origin: { kind: 'mock-url' }, target: { kind: 'mocks' } } as const;
    expect(matchesRunKind(ui, 'mocks')).toBe(true);
    expect(matchesRunKind(mockUrl, 'mocks')).toBe(false);
    expect(matchesRunKind(mockUrl, 'mock-url')).toBe(true);
    expect(matchesRunKind(ui, 'any')).toBe(true);
    expect(matchesRunKind({ origin: { kind: 'session', sessionId: 's', app: 'a' }, target: { kind: 'mocks' } }, 'session')).toBe(true);
  });
});
