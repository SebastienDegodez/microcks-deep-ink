import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { OperationList, OperationRow } from '@microcks-deep-ink/registry/react/operation-row';
import { OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/OperationRow',
  parameters: itemParams(['operation-row', 'method-tag', 'mock-url'], 'A list of operations. Each row is a link or a button (never a clickable `<div>`); the selected row has `aria-current="true"` and reveals its mock URL.'),
} satisfies Meta;

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

/** `protocol` colours the method tag and `mockUrl` shows the mock endpoint under the path. */
export const ProtocolAndMockUrl: StoryObj = {
  name: 'Protocol and mock URL',
  render: () => (
    <OperationList label="Operations of Pastry orders">
      <OperationRow method="SUBSCRIBE" protocol="EVENT" path="pastry/orders" meta="1 message" mockUrl="kafka://localhost:9092/pastry-orders" />
      <OperationRow method="GET" path="/pastries" meta="3 examples" mockUrl="http://localhost:8080/rest/API+Pastry/2.0.0/pastries" />
    </OperationList>
  ),
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
