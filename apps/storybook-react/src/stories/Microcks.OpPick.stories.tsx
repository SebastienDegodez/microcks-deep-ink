import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { OpPickList, type OpPickOption } from '@microcks-deep-ink/registry/react/op-pick';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/OpPick',
  parameters: itemParams(['op-pick', 'method-tag'], 'Operation picker cards. Toggle mode is a list of aria-pressed buttons (Service rail); radio mode is a radiogroup with arrow keys (Copilot).'),
} satisfies Meta;

const RAIL: OpPickOption[] = [
  { id: 'list', method: 'GET', path: '/pastries', summary: 'List pastries by size', meta: '3 examples · +1 AI', end: '812', endLabel: 'Calls over 7 days: ' },
  { id: 'get', method: 'GET', path: '/pastries/{name}', summary: 'Get a pastry by its name', meta: '2 examples', end: '340', endLabel: 'Calls over 7 days: ' },
  { id: 'patch', method: 'PATCH', path: '/pastries/{name}', summary: 'Update a pastry price', meta: '2 examples', end: '96', endLabel: 'Calls over 7 days: ' },
];

export const ServiceRail: StoryObj = {
  name: 'Toggle (Service rail)',
  render: () => {
    const [v, setV] = useState('list');
    return (
      <div style={{ maxWidth: 360 }}>
        <OpPickList label="Operations" options={RAIL} value={v} onChange={setV} />
      </div>
    );
  },
};

export const Copilot: StoryObj = {
  name: 'Radio (Copilot)',
  render: () => {
    const [v, setV] = useState('list');
    const ops: OpPickOption[] = RAIL.map((o, i) => ({ id: o.id, method: o.method, path: o.path, summary: `${3 - i} examples`, end: i === 0 ? '+2 pending' : i === 1 ? '+1 accepted' : undefined, endTone: i === 0 ? 'warning' : 'success' }));
    return (
      <section aria-labelledby="op-story" style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="op-story" className="section-label" data-size="sm">1 · Operation</h2>
        <OpPickList mode="radio" labelledBy="op-story" options={ops} value={v} onChange={setV} />
      </section>
    );
  },
};
