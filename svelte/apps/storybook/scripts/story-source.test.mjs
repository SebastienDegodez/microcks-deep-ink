import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'svelte/compiler';
import { componentSource } from '../.storybook/component-source.mjs';
import { storySources, storySourcePlugin } from './story-source.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stories = resolve(root, 'src/stories');
const sources = (file) => storySources(readFileSync(resolve(stories, file), 'utf8'), resolve(stories, file));

test('Button > Icons shows the actual Svelte Button example', () => {
  const { code } = sources('Components.Button.stories.ts').get('WithIcon');
  assert.match(code, /import \{ Button/);
  assert.match(code, /<Button variant="primary" icon="play">Run test<\/Button>/);
  assert.match(code, /<Button iconOnly icon="trash" aria-label="Delete example"/);
  assert.doesNotMatch(code, /WithIconComposition|Component:|render: \(\)/);
  parse(code);
});

test('nested compositions include the helper code instead of only <Demo />', () => {
  const { code } = sources('Components.Dialog.stories.ts').get('Default');
  assert.match(code, /<!-- Components.Dialog\/Default.svelte -->/);
  assert.match(code, /<!-- Components.Dialog\/Demo.svelte -->/);
  assert.match(code, /<Dialog /);
});

test('helper-created stories resolve their native Svelte composition', () => {
  assert.match(sources('Elements.WorkflowLoom.stories.ts').get('Default').code, /<WorkflowLoom/);
  assert.match(sources('Microcks.ApiBadge.stories.ts').get('Small').code, /<ApiBadge size="sm"/);
});

test('direct component source responds to Controls and escapes Svelte text', () => {
  const source = componentSource('Button', { variant: 'primary', disabled: false, children: 'Save <" {', icon: undefined });
  assert.match(source, /<Button variant="primary" disabled=\{false\}>Save &lt;" &#123;<\/Button>/);
  assert.doesNotMatch(source, /icon=/);
  assert.match(componentSource('Button', { variant: 'danger', disabled: true }), /variant="danger" disabled/);
  parse(source);
  parse(componentSource('Input', { value: 'a "quoted" {value} & b' }));
});

test('raw snippet args become Svelte content and named snippets, not callbacks', () => {
  const { component, snippets } = sources('Microcks.StatCard.stories.ts').get('Playground');
  assert.equal(component, 'StatCard');
  const source = componentSource(component, {
    title: () => {}, value: () => {}, unit: () => {}, children: () => {}, tone: 'success',
  }, snippets);
  assert.match(source, /{#snippet title\(\)}Conformance{\/snippet}/);
  assert.match(source, /Across 12 operations/);
  assert.doesNotMatch(source, /console\.log/);
  parse(source);
});

test('every current story gets real composition source or a public component example', () => {
  let count = 0;
  for (const file of readdirSync(stories).filter((name) => name.endsWith('.stories.ts'))) {
    for (const [name, source] of sources(file)) {
      assert.ok(source.code?.includes('<') || source.component, `${file}: ${name}`);
      count++;
    }
  }
  assert.equal(count, 307);
});

test('plugin watches example files and preserves existing story parameters', () => {
  const watched = [];
  const file = resolve(stories, 'Components.Button.stories.ts');
  const plugin = storySourcePlugin();
  const result = plugin.transform.call({ addWatchFile: (path) => watched.push(path) }, readFileSync(file, 'utf8'), file);
  assert.ok(watched.some((path) => path.endsWith('WithIcon.svelte')));
  assert.match(result.code, /WithIcon.parameters = \{ \.\.\.WithIcon.parameters/);
  assert.match(result.code, /language: 'svelte'/);
  assert.match(result.code, /type: 'code'/);
  assert.match(result.code, /<Button variant=\\"primary\\"/);
  assert.equal(plugin.transform('', '/some/component.ts'), undefined);
});

test('unresolvable examples fail explicitly instead of showing the CSF adapter', () => {
  assert.throws(() => storySources('export const Broken = {};', 'broken.stories.ts'), /No example component/);
});
