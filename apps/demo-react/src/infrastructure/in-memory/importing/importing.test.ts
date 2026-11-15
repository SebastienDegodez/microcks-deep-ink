import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationError } from '@microcks/demo-core/application/shared';
import { createImportingUseCases } from '@microcks/demo-core/application/importing';
import { detectArtifactKind, directApiEndpoint, filterImporters, importerStatus, originCounts, statusCounts, validateDirectApi, validateGitForm } from '@microcks/demo-core/domain/importing';

import { createInMemoryImportingAdapters } from '@microcks/demo-core/infrastructure/in-memory/importing';

let uc: { importing: ReturnType<typeof createImportingUseCases> };
beforeEach(() => {
  uc = { importing: createImportingUseCases(createInMemoryImportingAdapters()) };
});

describe('Import screen', () => {
  it('analyzes an OpenAPI file without creating anything, then imports it as primary', async () => {
    const preview = await uc.importing.analyze({ kind: 'file', files: [{ name: 'apipastry-openapi.yaml', sizeBytes: 5000 }] });
    expect(preview.services[0]?.operations).toHaveLength(3);
    expect(preview.exampleCount).toBe(7);
    const done = await uc.importing.import(preview.previewId, { role: 'primary' });
    expect(done).toMatchObject({ serviceId: 'pastry2', outcome: 'imported', mcp: true });
    const merged = await uc.importing.import((await uc.importing.analyze({ kind: 'file', files: [{ name: 'x-openapi.yaml', sizeBytes: 1 }] })).previewId, { role: 'secondary' });
    expect(merged.outcome).toBe('merged');
  });

  it('analyzes an Arazzo document: 4 workflows, 14 steps, 3 linked sources', async () => {
    const preview = await uc.importing.analyze({ kind: 'file', files: [{ name: 'pastry-workflows.arazzo.yaml', sizeBytes: 9000 }] });
    expect(preview.arazzo?.workflows).toHaveLength(4);
    expect(preview.arazzo?.workflows.reduce((n, w) => n + w.steps, 0)).toBe(14);
    expect(preview.arazzo?.sources).toHaveLength(3);
    expect(preview.arazzo?.workflows.find((w) => w.blocked)?.workflowId).toBe('order-pastry');
    const done = await uc.importing.import(preview.previewId, { role: 'primary' });
    expect(done).toMatchObject({ outcome: 'arazzo', arazzo: { workflows: 4, steps: 14, sources: 3 } });
  });

  it('a Git source creates a scheduled importer', async () => {
    const preview = await uc.importing.analyze({ kind: 'git', repository: 'https://raw.githubusercontent.com/acme/contracts/main/pastry/openapi.yaml', name: 'API Pastry — main' });
    expect((await uc.importing.import(preview.previewId, { role: 'primary' })).outcome).toBe('importer-created');
  });

  it('rejects an empty selection or URL', async () => {
    await expect(uc.importing.analyze({ kind: 'file', files: [] })).rejects.toBeInstanceOf(ValidationError);
    await expect(uc.importing.analyze({ kind: 'url', url: '  ' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('creates a Direct API mock and validates the form', async () => {
    expect(validateDirectApi({ type: 'GENERIC_EVENT', name: 'Order API', version: '1.0', resource: 'order' }).payload).toMatch(/needs a reference JSON payload/);
    expect(validateDirectApi({ type: 'REST', name: '', version: '', resource: '1x', payload: '{' })).toMatchObject({ name: expect.any(String), resource: expect.any(String), payload: expect.stringContaining('Invalid JSON') });
    const input = { type: 'REST' as const, name: 'Order API', version: '1.0', resource: 'order', payload: '{"id":1}' };
    expect(validateDirectApi(input)).toEqual({});
    const result = await uc.importing.createDirectApi(input);
    expect(result).toMatchObject({ outcome: 'direct', protocol: 'DIRECT', samples: 'dynamic', mockLabel: 'Mock base URL' });
    expect(result.mockUrl).toBe(directApiEndpoint(input, 'http://microcks.local:8080').value);
    expect(directApiEndpoint({ ...input, type: 'GENERIC_EVENT' }, 'x').value).toBe('OrderAPI-1.0-order');
  });

  it('lists the recent imports and detects formats', async () => {
    expect((await uc.importing.recentImports(3)).map((r) => r.name)).toEqual(['API Pastry 2.0', 'Pastry orders API 0.1.0', 'HelloService v1']);
    expect(detectArtifactKind('pastry.arazzo.yaml')).toBe('arazzo');
    expect(detectArtifactKind('hello.proto')).toBe('grpc');
    expect(validateGitForm({ name: '', url: 'nope' })).toMatchObject({ name: expect.any(String), url: expect.any(String) });
  });

  it('puts a done import at the top of the recent imports', async () => {
    const preview = await uc.importing.analyze({ kind: 'file', sample: true, files: [{ name: 'agent-card.json', sizeBytes: 3277 }] });
    await uc.importing.import(preview.previewId, { role: 'primary' });
    const recent = await uc.importing.recentImports(3);
    expect(recent.map((r) => r.name)).toEqual(['Pastry concierge 1.0', 'API Pastry 2.0', 'Pastry orders API 0.1.0']);
    expect(recent[0]).toMatchObject({ via: 'Upload', statusText: 'No conversations' });
    const pastry = await uc.importing.analyze({ kind: 'url', url: 'https://example.com/apipastry-openapi.yaml' });
    expect(pastry.services[0]?.name).toBe('API Pastry');
    const done = await uc.importing.import(pastry.previewId, { role: 'primary' });
    expect(done.createdSource).toMatchObject({ origin: 'URL', schedule: 'scheduled · global scan' });
    expect((await uc.importing.recentImports(3)).map((r) => r.name)).toEqual(['API Pastry 2.0', 'Pastry concierge 1.0', 'Pastry orders API 0.1.0']);
  });
});

describe('Sources screen', () => {
  it('lists the twelve sources (two are one-off uploads) with the failed and inactive ones', async () => {
    const all = await uc.importing.listImporters();
    expect(all).toHaveLength(12);
    const counts = statusCounts(all);
    expect(counts).toMatchObject({ all: 12, failed: 1, warning: 1, inactive: 1, running: 1 });
    expect(all.find((i) => i.id === 'pastry-orders')?.error?.message).toContain('401');
  });

  it('filters by status and by text (name, URL, secret, produced Service)', async () => {
    const all = await uc.importing.listImporters();
    expect(filterImporters(all, { status: 'failed' }).map((i) => i.id)).toEqual(['pastry-orders']);
    expect(filterImporters(all, { query: 'gitlab-bakery' }).map((i) => i.id)).toEqual(['pastry-orders']);
    expect(filterImporters(all, { query: 'helloservice' }).map((i) => i.id).sort()).toEqual(['hello-grpc', 'hello-soap']);
    expect(importerStatus(all.find((i) => i.id === 'movie-graph')!)).toBe('inactive');
  });

  it('runs an importer to 100% and records a new timeline entry', async () => {
    const seen: number[] = [];
    const before = (await uc.importing.getImporter('hello-grpc')).timeline.length;
    await new Promise<void>((resolve) => {
      const stop = uc.importing.runImporter('hello-grpc', (p) => {
        seen.push(p);
        if (p === 100) {
          stop();
          resolve();
        }
      });
    });
    expect(seen).toEqual([25, 50, 75, 100]);
    const after = await uc.importing.getImporter('hello-grpc');
    expect(after.timeline.length).toBe(before + 1);
    expect(after.timeline[0]).toMatchObject({ kind: 'run', trigger: 'Forced by MA' });
  }, 15000);

  it('deletes an importer and undoes it', async () => {
    await uc.importing.deleteImporter('beer-catalog');
    expect((await uc.importing.listImporters()).map((i) => i.id)).not.toContain('beer-catalog');
    await uc.importing.undoDeleteImporter('beer-catalog');
    expect((await uc.importing.listImporters()).map((i) => i.id)).toContain('beer-catalog');
  });

  it('puts an undone source back at its original place', async () => {
    const before = (await uc.importing.listImporters()).map((i) => i.id);
    await uc.importing.deleteImporter('pastry-openapi');
    await uc.importing.undoDeleteImporter('pastry-openapi');
    expect((await uc.importing.listImporters()).map((i) => i.id)).toEqual(before);
  });

  it('pauses scans and returns the diff of a timeline entry', async () => {
    expect((await uc.importing.setImporterActive('hello-soap', false)).active).toBe(false);
    const diff = await uc.importing.getImporterDiff('pastry-openapi', '3c9e1d0', 'a41f9c2');
    expect(diff.lines.some((l) => l.kind === 'added')).toBe(true);
    expect(diff.lines.some((l) => l.kind === 'removed')).toBe(true);
    await expect(uc.importing.getImporterDiff('pastry-openapi', 'a', 'b')).rejects.toBeInstanceOf(ValidationError);
  });

  it('shows the hourly scan window from the demo clock', () => {
    const s = uc.importing.getScanSchedule();
    expect(s.cron).toBe('0 0 * * * *');
    expect(s.lastScanAt).toBe('2026-11-03T09:00:00.000Z');
    expect(s.minutesSinceLast).toBe(10);
    expect(s.minutesUntilNext).toBe(50);
  });
});

describe('Sources by origin and A2A', () => {
  it('counts the origins and filters on them; uploads are one-off and never inactive', async () => {
    const all = await uc.importing.listImporters();
    expect(originCounts(all)).toEqual({ all: 12, upload: 2, url: 4, git: 4, hub: 2 });
    expect(filterImporters(all, { origin: 'upload' }).map((i) => i.id)).toEqual(['upload-agent-card', 'upload-postman']);
    const upload = all.find((i) => i.id === 'upload-agent-card');
    expect(upload).toMatchObject({ origin: 'upload', kind: 'a2a', schedule: 'no schedule · one-off', active: true });
    expect(upload?.produces[0]).toMatchObject({ protocol: 'A2A', id: 'concierge' });
    expect(uc.importing.getScanSchedule().description).toBe('every hour, global to all scheduled sources');
  });

  it('detects an Agent Card and previews 3 skills and 3 interfaces before anything is created', async () => {
    const preview = await uc.importing.analyze({ kind: 'file', files: [{ name: 'agent-card.json', sizeBytes: 3277 }] });
    expect(preview.agent?.skills.map((s) => s.id)).toEqual(['recommend-pastry', 'order-pastry', 'track-order']);
    expect(preview.agent?.interfaces.map((i) => i.binding)).toEqual(['JSONRPC', 'HTTP+JSON', 'GRPC']);
    expect(preview.services[0]).toMatchObject({ protocol: 'A2A', kind: 'a2a' });
    const result = await uc.importing.import(preview.previewId, { role: 'primary' });
    expect(result).toMatchObject({ outcome: 'a2a', serviceId: 'concierge', operationCount: 3 });
  });
});
