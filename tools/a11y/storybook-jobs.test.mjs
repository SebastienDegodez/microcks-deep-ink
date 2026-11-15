import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storybookJobs } from './storybook-jobs.mjs';
const entries = {
  button: { id: 'components-button--default', type: 'story' },
  intro: { id: 'introduction--docs', type: 'docs', importPath: './src/Introduction.mdx' },
  usage: { id: 'usage-natural-components--docs', type: 'docs', importPath: './src/Natural.mdx' },
};
const relative = (url) => new URL(url, 'https://example.test/svelte/').href;
test('existing story-only audits are unchanged', () => {
  assert.deepEqual(storybookJobs(entries, relative), [{ url: 'https://example.test/svelte/iframe.html?id=components-button--default&viewMode=story', label: 'components-button--default', kind: 'story' }]);
});
test('Svelte MDX docs are discoverable under the Pages base', () => {
  const jobs = storybookJobs(entries, relative, true);
  assert.equal(jobs.length, 3);
  assert.equal(jobs[1].url, 'https://example.test/svelte/iframe.html?id=introduction--docs&viewMode=docs');
  assert.equal(jobs[2].label, 'usage-natural-components--docs');
});
