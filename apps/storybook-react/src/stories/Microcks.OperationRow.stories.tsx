import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { OperationList, OperationRow } from '@microcks-deep-ink/registry/react/operation-row';
import { OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/OperationRow',
  component: OperationRow,
  parameters: itemParams(['operation-row', 'method-tag', 'mock-url'], 'A list of operations. Each row is a link or a button (never a clickable `<div>`); the selected row has `aria-current="true"` and reveals its mock URL.'),
} satisfies Meta<typeof OperationRow>;

export const Default: StoryObj = {
  render: () => {
    const [sel, setSel] = useState(1);
    return (
      <div style={{ maxWidth: 720 }}>
        <OperationList label="Operations of API Pastry 2.0">
          {OPERATIONS.map((op, i) => (
            <OperationRow key={`${op.method}${op.path}`} {...op} selected={sel === i} onSelect={() => setSel(i)} />
          ))}
        </OperationList>
      </div>
    );
  },
};

export const AsLinks: StoryObj = {
  name: 'Links',
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <OperationList label="Operations of API Pastry 2.0">
        {OPERATIONS.map((op, i) => (
          <OperationRow key={`${op.method}${op.path}`} method={op.method} path={op.path} meta={op.meta} href={`#op-${i}`} selected={i === 0} />
        ))}
      </OperationList>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof OperationRow> = {
  args: { method: 'GET', path: '/pastries/{name}', protocol: 'REST', meta: '3 examples', mockUrl: undefined, selected: false, href: undefined },
  argTypes: { protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'] } },
  decorators: [(Story) => <OperationList label="Operations"><Story /></OperationList>],
};
