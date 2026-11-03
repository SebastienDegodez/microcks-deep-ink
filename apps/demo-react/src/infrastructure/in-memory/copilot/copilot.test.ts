import { beforeEach, describe, expect, it } from 'vitest';
import { createCatalogUseCases } from '@/application/catalog';
import { createCopilotUseCases } from '@/application/copilot';
import { findCriteriaConflict, validateExampleDraft } from '@/domain/copilot';
import { createInMemoryCatalogAdapters } from '../catalog';
import { createInMemoryCopilotAdapters } from '.';

let uc: { catalog: ReturnType<typeof createCatalogUseCases>; copilot: ReturnType<typeof createCopilotUseCases> };
beforeEach(() => {
  const catalog = createInMemoryCatalogAdapters();
  const copilot = createInMemoryCopilotAdapters();
  uc = { catalog: createCatalogUseCases({ catalog: catalog.catalog }), copilot: createCopilotUseCases({ copilot: copilot.copilot, catalog: catalog.catalog }) };
});

describe('AI Copilot screen', () => {
  it('leads the proposals with the hint and marks them as pending AI examples', async () => {
    const proposals = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 3, hint: 'Tarte Tatin' });
    expect(proposals).toHaveLength(3);
    expect(proposals[0]?.name).toContain('Tarte Tatin');
    expect(proposals.every((p) => p.aiGenerated && p.reviewState === 'pending')).toBe(true);
  });

  it('does not propose the excluded names again', async () => {
    const first = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 2 });
    const next = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 2, exclude: first.map((p) => p.name) });
    expect(next.map((p) => p.name).filter((n) => first.some((f) => f.name === n))).toEqual([]);
  });

  it('accepting adds a tagged example to the Service; rejecting stores nothing', async () => {
    const [p, q] = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 2 });
    const before = (await uc.catalog.listExamples('pastry2', 'get-name')).length;
    const stored = await uc.copilot.accept('pastry2', 'get-name', p!);
    expect(stored).toMatchObject({ aiGenerated: true, reviewState: 'accepted' });
    await uc.copilot.reject('pastry2', 'get-name', q!.id);
    expect(await uc.catalog.listExamples('pastry2', 'get-name')).toHaveLength(before + 1);
  });

  it('warns when a proposal reuses the dispatch criteria of a served example', async () => {
    const sizes = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-list', count: 5 });
    const served = await uc.catalog.listExamples('pastry2', 'get-list');
    const clash = sizes.map((p) => findCriteriaConflict(p, served)).filter(Boolean);
    expect(clash.length).toBeGreaterThan(0);
    expect(clash[0]).toContain('already used by example');
  });

  it('validates an edited draft', () => {
    expect(validateExampleDraft({ name: 'x', body: '{' })).toMatch(/Invalid JSON/);
    expect(validateExampleDraft({ name: ' ', body: '{}' })).toMatch(/needs a name/);
    expect(validateExampleDraft({ name: 'ok', body: '{}' })).toBeUndefined();
  });

  it('exports accepted examples as an APIExamples artifact in YAML or JSON', async () => {
    const [p] = await uc.copilot.generate({ serviceId: 'pastry2', operationId: 'get-name', count: 1 });
    const yaml = uc.copilot.exportApiExamples({ name: 'API Pastry', version: '2.0' }, [{ operationKey: 'GET /pastries/{name}', examples: [p!] }], 'yaml');
    expect(yaml.text).toContain('apiVersion: mocks.microcks.io/v1alpha1');
    expect(yaml.text).toContain('kind: APIExamples');
    expect(yaml.text).toContain('GET /pastries/{name}');
    const json = uc.copilot.exportApiExamples({ name: 'API Pastry', version: '2.0' }, [{ operationKey: 'GET /pastries/{name}', examples: [p!] }], 'json');
    expect(() => JSON.parse(json.text)).not.toThrow();
  });

  it('finds the workflow context behind ?hint=Tarte Tatin, and none for another hint', async () => {
    const ctx = await uc.copilot.findWorkflowContext('pastry2', 'Tarte Tatin');
    expect(ctx).toMatchObject({ workflowId: 'restock-pastry', operationId: 'get-name', criteria: 'name=Tarte Tatin' });
    expect(await uc.copilot.findWorkflowContext('pastry2', undefined)).toBeUndefined();
  });
});
