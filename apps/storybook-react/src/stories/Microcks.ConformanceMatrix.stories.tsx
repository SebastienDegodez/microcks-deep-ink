import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ConformanceMatrix, cellKey } from '@microcks-deep-ink/registry/react/conformance-matrix';
import { MATRIX_COLUMNS, MATRIX_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ConformanceMatrix',
  parameters: itemParams(['conformance-matrix', 'icon'], 'Checks by columns (here the three A2A transports) as a real table. Each cell writes its result with a glyph and a word. A finished cell is a button that selects it; queued and running cells are plain text. A cell without a column spans all of them.'),
} satisfies Meta;

const FOOTER = { label: 'Conversations passed', cells: [{ text: '2/3', tone: 'danger' as const }, { text: '1/3' }, { text: '2/3', tone: 'danger' as const }] };

export const Default: StoryObj = {
  render: () => <ConformanceMatrix caption="Conformance matrix" columns={MATRIX_COLUMNS} groups={MATRIX_GROUPS} footer={FOOTER} />,
};

export const SelectableCells: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string | undefined>(cellKey('eclair-size-m', 'http'));
    return (
      <div className="sb-col">
        <ConformanceMatrix caption="Conformance matrix" columns={MATRIX_COLUMNS} groups={MATRIX_GROUPS} footer={FOOTER} selectedKey={selected} onSelectCell={setSelected} />
        <p role="status">{selected ? `Detail of ${selected.replace('|', ' on ')}` : 'Select a finished cell to see the exchange.'}</p>
      </div>
    );
  },
};
