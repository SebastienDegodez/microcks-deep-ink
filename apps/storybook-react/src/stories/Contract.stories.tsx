import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn } from 'storybook/test';
import { MkAiGhostRow, MkConformanceBand, MkDataTable, MkDropZone, MkMockUrl, MkOperationRow, MkPanel } from '@microcks-deep-ink/react';
import { CATALOGUE_COLUMNS, CATALOGUE_ROWS, CONFORMANCE, MOCK_BASE, OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = { title: 'Contract' };
export default meta;

export const MockUrl: StoryObj<typeof MkMockUrl> = {
  render: (args) => <MkMockUrl {...args} />,
  args: { url: `${MOCK_BASE}/pastries/Millefeuille`, method: 'GET', mcpTool: 'get_pastry_by_name', onMkCopy: fn() },
  parameters: { docs: { description: { story: 'The live endpoint of a mock, one click from the clipboard. "Copied" for 2 s, no toast.' } } },
};

export const OperationList: StoryObj<typeof MkOperationRow> = {
  render: () => {
    const [sel, setSel] = useState('/pastries/{name}');
    return (
      <MkPanel flush style={{ maxWidth: 640 }}>
        {OPERATIONS.map((o) => (
          <MkOperationRow
            key={o.method + o.path}
            method={o.method}
            path={o.path}
            meta={o.meta}
            mockUrl={o.mockUrl ?? `${MOCK_BASE}${o.path}`}
            selected={sel === o.path && o.method === 'GET'}
            onMkSelect={(e) => setSel(e.detail.path)}
          />
        ))}
      </MkPanel>
    );
  },
};

export const AiGhostRow: StoryObj<typeof MkAiGhostRow> = {
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <MkAiGhostRow {...args}>Tartelette Framboise · 200</MkAiGhostRow>
    </div>
  ),
  args: { onMkAccept: fn(), onMkEdit: fn(), onMkReject: fn() },
  parameters: { docs: { description: { story: 'AI content is always labelled until a human accepts it. Never counted in conformance.' } } },
};

export const ConformanceBand: StoryObj<typeof MkConformanceBand> = {
  name: 'Proof / ConformanceBand',
  render: () => (
    <div className="di-col">
      <MkConformanceBand outcomes={CONFORMANCE} />
      <MkConformanceBand size="mini" outcomes={CONFORMANCE} />
      <MkConformanceBand outcomes={['pass', 'fail', 'fail', 'pass', 'untested']} />
    </div>
  ),
};

export const Catalogue: StoryObj<typeof MkDataTable> = {
  render: (args) => <MkDataTable {...args} />,
  args: { columns: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS, interactive: true, selectedKey: 'pastry', onMkRowClick: fn() },
};

export const EmptyTable: StoryObj<typeof MkDataTable> = {
  render: () => <MkDataTable columns={CATALOGUE_COLUMNS} rows={[]} emptyText="No service yet. Import a contract to create your first mock." />,
};

export const DropZone: StoryObj<typeof MkDropZone> = {
  render: (args) => <MkDropZone {...args} />,
  args: { onMkFiles: fn() },
};

export const ServiceHeader: StoryObj = {
  name: 'Composition / Service panel',
  render: () => (
    <MkPanel heading="API Pastry 2.0" subheading="3 operations · URI_PARTS dispatcher" style={{ maxWidth: 720 }}>
      <div className="di-col">
        <MkMockUrl url={`${MOCK_BASE}/pastries/Millefeuille`} mcpTool="get_pastry_by_name" />
        <MkConformanceBand outcomes={CONFORMANCE} />
      </div>
    </MkPanel>
  ),
};
