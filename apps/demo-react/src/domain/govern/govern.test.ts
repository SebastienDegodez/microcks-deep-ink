import { describe, expect, it } from 'vitest';
import { membershipChanges, membershipKey, packageTotals, previewInstall, secretCredentials, validateSecretForm, type HubPackage } from './index';

const pkg: HubPackage = {
  id: 'p', name: 'Pastry samples', category: 'Samples', description: '', versions: [], apiCount: 2, installed: false,
  apis: [
    { protocol: 'REST', name: 'API Pastry', versions: ['2.0', '1.0'], operations: { '2.0': 3, '1.0': 3 }, examples: { '2.0': 7, '1.0': 5 }, contracts: 'OpenAPI', postman: true, inCatalogue: ['2.0', '1.0'] },
    { protocol: 'EVENT', name: 'Brand new events', versions: ['1.0.0'], operations: { '1.0.0': 1 }, examples: { '1.0.0': 2 }, contracts: 'AsyncAPI', inCatalogue: [] },
  ],
};

describe('install preview', () => {
  it('main artifact: new and updated Services, importers and the mock URL', () => {
    const p = previewInstall(pkg, {}, 'sync', 'main', '');
    expect(p.rows.map((r) => r.tag)).toEqual(['UPDATE', 'NEW']);
    expect(p.created.map((c) => c.sign)).toEqual(['+', '~', '+', '→']);
    expect(p.created[2]?.text).toBe('3 importers in Sources, one per artifact');
    expect(p.created[3]?.sub).toBe('http://microcks.local:8080/rest/API+Pastry/2.0');
    expect(p.installLabel).toBe('Install and keep in sync');
    expect(p.blocked).toBeUndefined();
  });

  it('one-shot import uploads once', () => {
    const p = previewInstall(pkg, {}, 'one-shot', 'main', '');
    expect(p.created.at(-2)?.text).toBe('3 artifacts uploaded once, no importer created');
    expect(p.installLabel).toBe('Install once');
  });

  it('secondary artifact merges only into existing Services and is blocked when nothing exists', () => {
    expect(previewInstall(pkg, {}, 'sync', 'secondary', '').rows.map((r) => r.tag)).toEqual(['MERGE', 'SKIPPED']);
    const none = previewInstall({ ...pkg, apis: [pkg.apis?.[1] as NonNullable<HubPackage['apis']>[number]] }, {}, 'sync', 'secondary', '');
    expect(none.blocked).toContain('would create nothing');
  });

  it('shows the catalogue once installed and honours the picked version', () => {
    const p = previewInstall(pkg, { 'API Pastry': '1.0' }, 'sync', 'main', 'installed');
    expect(p.heading).toBe('Installed');
    expect(p.rows.every((r) => r.tag === 'IN CATALOGUE')).toBe(true);
    expect(p.rows[0]?.version).toBe('1.0');
    expect(packageTotals(pkg, { 'API Pastry': '1.0' })).toEqual({ operations: 4, examples: 7 });
  });
});

describe('secret form and memberships', () => {
  it('validates name and credential', () => {
    const ok = { name: 'my-token', kind: 'token' as const, description: '', secret: 'abc' };
    expect(validateSecretForm(ok, [])).toEqual({});
    expect(validateSecretForm({ ...ok, name: '' }, []).name).toBe('Name required');
    expect(validateSecretForm({ ...ok, name: 'Bad Name' }, []).name).toBe('Lowercase letters, digits and dashes');
    expect(validateSecretForm(ok, ['my-token']).name).toBe('This name already exists');
    expect(validateSecretForm({ ...ok, secret: '' }, []).secret).toBe('Credential required');
    // Editing: the name is fixed and an empty credential keeps the stored one.
    expect(validateSecretForm({ ...ok, secret: '' }, ['my-token'], true)).toEqual({});
    expect(secretCredentials({ kind: 'token', secret: 'x', user: 'PRIVATE-TOKEN' })).toBe('header PRIVATE-TOKEN · token ••••••••');
    expect(secretCredentials({ kind: 'ca', secret: '-----BEGIN CERTIFICATE-----\n-----BEGIN CERTIFICATE-----' })).toBe('PEM · 2 certificates');
  });

  it('lists the added and removed memberships of a draft', () => {
    const saved = [membershipKey('pastry', 'tom'), membershipKey('pets', 'tom')];
    const draft = [membershipKey('pastry', 'tom'), membershipKey('beer', 'clara')];
    expect(membershipChanges(saved, draft)).toEqual([
      { groupId: 'beer', userId: 'clara', kind: 'add' },
      { groupId: 'pets', userId: 'tom', kind: 'remove' },
    ]);
  });
});
