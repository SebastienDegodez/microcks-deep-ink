import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SECRET_KIND_HINT,
  SECRET_KIND_LABEL,
  SECRET_NAME_PATTERN,
  membershipChanges,
  membershipKey,
  secretCredentials,
  secretFormHint,
  validateSecretForm,
} from '@microcks/demo-core/domain/govern';

const valid = { name: 'my-token', kind: 'token', description: '', secret: 'abc' };

test('creation keeps validation messages, name limits and first-error priority', () => {
  assert.deepEqual(validateSecretForm(valid, []), {});
  assert.deepEqual(validateSecretForm({ ...valid, name: '', secret: '' }, []), {
    name: 'Name required', secret: 'Credential required',
  });
  assert.equal(validateSecretForm({ ...valid, name: 'Bad Name' }, []).name, 'Lowercase letters, digits and dashes');
  assert.equal(validateSecretForm(valid, ['my-token']).name, 'This name already exists');
  assert.equal(SECRET_NAME_PATTERN.test('a'), false);
  assert.equal(SECRET_NAME_PATTERN.test('ab'), true);
  assert.equal(SECRET_NAME_PATTERN.test('a'.repeat(63)), true);
  assert.equal(SECRET_NAME_PATTERN.test('a'.repeat(64)), false);
  assert.equal(secretFormHint({ name: 'Name required', secret: 'Credential required' }), 'Name required');
  assert.equal(secretFormHint({ secret: 'Credential required' }), 'Credential required');
  assert.equal(secretFormHint({}), '');
});

test('editing leaves the fixed name and stored credential alone', () => {
  assert.deepEqual(validateSecretForm({ ...valid, secret: '' }, ['my-token'], true), {});
  assert.deepEqual(validateSecretForm({ ...valid, name: '', secret: '' }, [], true), {});
});

test('credential summaries preserve every kind without exposing credential values', () => {
  const cases = [
    [{ kind: 'basic', secret: 'private-value', user: 'tom' }, 'user tom · password ••••••••'],
    [{ kind: 'basic', secret: '' }, 'user — · password '],
    [{ kind: 'token', secret: 'private-value', user: 'PRIVATE-TOKEN' }, 'header PRIVATE-TOKEN · token ••••••••'],
    [{ kind: 'token', secret: 'private-value' }, 'Authorization: Bearer · token ••••••••'],
    [{ kind: 'oauth2', secret: 'private-value', user: 'client', scopes: 'read write' }, 'client client · secret •••••••• · scope read write'],
    [{ kind: 'oauth2', secret: '' }, 'client — · secret '],
    [{ kind: 'ca', secret: '' }, 'PEM · 1 certificate'],
    [{ kind: 'ca', secret: '-----BEGIN CERTIFICATE-----\n-----BEGIN CERTIFICATE-----' }, 'PEM · 2 certificates'],
  ];
  for (const [values, expected] of cases) assert.equal(secretCredentials(values), expected);
  assert.deepEqual(Object.keys(SECRET_KIND_HINT), ['basic', 'token', 'oauth2', 'ca']);
  assert.deepEqual(SECRET_KIND_LABEL, { basic: 'Basic', token: 'Token', oauth2: 'OAuth2', ca: 'CA cert' });
});

test('membership drafts retain input order, additions first, without mutation', () => {
  const saved = Object.freeze([membershipKey('pastry', 'tom'), membershipKey('pets', 'tom')]);
  const draft = Object.freeze([membershipKey('pastry', 'tom'), membershipKey('beer', 'clara')]);
  assert.deepEqual(membershipChanges(saved, draft), [
    { groupId: 'beer', userId: 'clara', kind: 'add' },
    { groupId: 'pets', userId: 'tom', kind: 'remove' },
  ]);
  assert.deepEqual(membershipChanges(saved, saved), []);
  assert.deepEqual(membershipChanges([], []), []);
});
