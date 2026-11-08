import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import { CiPanel, DropZone, RunProgress, RunTarget, StepChecks, StepStatus, Stepper, TaskLanes, TaskStateTag, TaskTimeline } from '../src/lib/index.js';

it('server-renders run progress with named bar, counts and note', () => {
  const { body } = render(RunProgress, { props: { done: 1, total: 2, caption: 'steps done', segments: ['done', 'queued'], counts: [{ kind: 'pass', text: '1 passed' }], note: 'Paused' } });
  expect(body).toContain('aria-label="Progress"');
  expect(body).toContain('aria-label="1 of 2 steps done"');
  expect(body).toContain('data-seg="queued"');
  expect(body).toContain('1 passed');
  expect(body).toContain('Paused');
});
it('server-renders the target and checks with their written meanings', () => {
  expect(render(RunTarget, { props: { target: 'mixed' } }).body).toContain('Proposed · beyond POC');
  expect(render(StepStatus, { props: { status: 'failed', attempts: 1 } }).body).toContain('· 1 attempt');
  const { body } = render(StepChecks, { props: { successCriteria: 'passed', schemaValidation: 'off' } });
  expect(body).toContain('Success criteria');
  expect(body).toContain('Schema validation');
  expect(body).toContain('Off');
});
it('server-renders stepper progress and instruction variants', () => {
  const { body } = render(Stepper, { props: { steps: [{ label: 'Upload', state: 'done' }, { label: 'Review', state: 'current' }] } });
  expect(body).toContain('aria-current="step"');
  expect(body).toContain(', done');
  const instructions = render(Stepper, { props: { variant: 'list', marker: 'circle', steps: [{ label: 'Paste' }] } }).body;
  expect(instructions).toContain('data-marker="circle"');
  expect(instructions).toContain('aria-hidden="true"');
});
it('server-renders task states, static timelines and comparison lanes', () => {
  expect(render(TaskStateTag, { props: { state: 'working', ghost: true } }).body).toContain('data-ghost=""');
  const timeline = render(TaskTimeline, { props: { nodes: [{ state: 'completed', at: '+1 s' }] } }).body;
  expect(timeline).toContain('aria-label="Task lifecycle"');
  expect(timeline).toContain('other end states');
  const lanes = render(TaskLanes, { props: { lanes: [{ label: 'Actual', nodes: [{ label: 'restarted', tone: 'bad' }] }] } }).body;
  expect(lanes).toContain('tabindex="0"');
  expect(lanes).toContain('(illegal)');
});
it('server-renders a named CI region and file group without browser effects', () => {
  const ci = render(CiPanel, { props: { title: 'Pipeline', command: 'microcks test', dashed: true } }).body;
  expect(ci).toContain('aria-labelledby=');
  expect(ci).toContain('Pipeline');
  expect(ci).toContain('microcks test');
  const drop = render(DropZone, { props: { heading: 'Import', hint: 'JSON', onfiles: () => { throw new Error('No selection during SSR'); } } }).body;
  expect(drop).toContain('role="group"');
  expect(drop).toContain('type="file"');
  expect(drop).toContain('Choose files');
  expect(drop).toContain('role="status"');
});
