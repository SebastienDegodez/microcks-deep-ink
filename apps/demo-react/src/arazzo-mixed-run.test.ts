import { describe, expect, it } from 'vitest';
import type { RunTarget, WorkflowRun } from '@/domain/arazzo';
import { createUseCases } from '@/composition-root';
import { apiBodyOf, targetLine } from '@/ui/pages/workflow-run/run';
import { setupApiBody, type SetupBodyState } from '@/ui/pages/workflow-run/setup';

const CUSTOMERS = 'https://customers.staging.example';

async function state(over: Partial<SetupBodyState>): Promise<SetupBodyState> {
  const { workflow } = await createUseCases().arazzo.getWorkflow('pastry', 'compare-prices');
  return {
    workflow,
    inputs: {},
    timeoutMs: 10_000,
    target: 'mixed',
    baseUrls: {},
    perSource: {},
    secret: undefined,
    validate: true,
    example: '',
    ...over,
  };
}

async function runOn(target: RunTarget, secret?: string): Promise<WorkflowRun> {
  const run = (await createUseCases().arazzo.listRuns('pastry', 'restock-pastry'))[0]!;
  return { ...run, target, options: { inputs: { size: 'M' }, timeoutMs: 10_000, validateSchemas: true, ...(secret ? { secret } : {}) } };
}

describe('the API body of the setup form', () => {
  it('sends a mixed run with its implementations, its target and the secret', async () => {
    const body = setupApiBody(
      await state({ baseUrls: { apiPastry: CUSTOMERS, apiPastryV1: 'https://stale.example' }, perSource: { apiPastry: 'implementation', apiPastryV1: 'mock' }, secret: 'staging' }),
    );
    expect(body).toMatchObject({
      implementations: { apiPastry: CUSTOMERS },
      target: { kind: 'mixed', perSource: { apiPastry: 'implementation', apiPastryV1: 'mock' } },
      secretName: 'staging',
      validateSchema: true,
    });
  });

  it('names every source in perSource: a source left out goes on its mocks', async () => {
    const body = setupApiBody(await state({ baseUrls: { apiPastry: CUSTOMERS }, perSource: { apiPastry: 'implementation' } }));
    expect(body.target).toEqual({ kind: 'mixed', perSource: { apiPastry: 'implementation', apiPastryV1: 'mock' } });
  });

  it('sends no secret when no source goes to its implementation', async () => {
    const body = setupApiBody(await state({ perSource: { apiPastry: 'mock' }, secret: 'staging' }));
    expect(body).not.toHaveProperty('secretName');
    expect(body).not.toHaveProperty('implementations');
  });

  it('keeps the two other targets as the POC takes them', async () => {
    const impl = setupApiBody(await state({ target: 'implementations', baseUrls: { apiPastry: CUSTOMERS }, secret: 'staging' }));
    expect(impl).toMatchObject({ implementations: { apiPastry: CUSTOMERS }, secretName: 'staging' });
    expect(impl).not.toHaveProperty('target');
    const mocks = setupApiBody(await state({ target: 'mocks', baseUrls: { apiPastry: CUSTOMERS }, secret: 'staging' }));
    expect(mocks).not.toHaveProperty('implementations');
    expect(mocks).not.toHaveProperty('secretName');
  });
});

describe('a mixed run read back', () => {
  const mixed: RunTarget = { kind: 'mixed', perSource: { customerApi: 'implementation', orderApi: 'mock' }, baseUrls: { customerApi: CUSTOMERS } };

  it('rebuilds the launch body of the run', async () => {
    expect(apiBodyOf(await runOn(mixed, 'staging'))).toMatchObject({
      implementations: { customerApi: CUSTOMERS },
      target: { kind: 'mixed', perSource: { customerApi: 'implementation', orderApi: 'mock' } },
      secretName: 'staging',
    });
  });

  it('leaves the secret out when every source is on its mocks', async () => {
    const body = apiBodyOf(await runOn({ kind: 'mixed', perSource: { orderApi: 'mock' } }, 'staging'));
    expect(body).not.toHaveProperty('secretName');
    expect(body).not.toHaveProperty('implementations');
  });

  it('says where each source goes, without any proposal wording', async () => {
    const line = targetLine(await runOn(mixed));
    expect(line).toBe(`Mixed · customerApi → ${CUSTOMERS} · orderApi → its mocks`);
    expect(line).not.toMatch(/propos|POC/i);
  });
});
