import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ApiBadge } from '@microcks-deep-ink/registry/react/api-badge';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { ConformanceBand } from '@microcks-deep-ink/registry/react/conformance-band';
import { DescriptionList } from '@microcks-deep-ink/registry/react/description-list';
import { OperationList, OperationRow } from '@microcks-deep-ink/registry/react/operation-row';
import { Panel } from '@microcks-deep-ink/registry/react/panel';
import { StatusBadge } from '@microcks-deep-ink/registry/react/status-badge';
import { TabPanel, Tabs } from '@microcks-deep-ink/registry/react/tabs';
import { CONFORMANCE, MOCK_BASE, OPERATIONS, SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Patterns/Service page',
  parameters: itemParams(['panel', 'tabs', 'api-badge', 'conformance-band', 'operation-row', 'status-badge', 'description-list', 'button'], 'A service detail page built only from registry items: proof badges and conformance in the header, tabs for the sections, the operation list with the mock URL of the selected one.', { layout: 'padded' }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [tab, setTab] = useState('operations');
    const [sel, setSel] = useState(1);
    return (
      <div className="sb-col" style={{ maxWidth: 960 }}>
        <header className="sb-col">
          <h1 style={{ font: 'var(--type-section)', margin: 0 }}>API Pastry</h1>
          <div className="di-inline">
            <ApiBadge protocol="REST" name="API Pastry" version="2.0" />
            <StatusBadge status="partial" label="92 % conformant" />
            <ApiBadge label="last test" value="2 h ago" />
            <Button variant="primary" icon="play">Run test</Button>
          </div>
          <ConformanceBand outcomes={CONFORMANCE} />
        </header>
        <Tabs label="Service sections" items={SERVICE_TABS} value={tab} onChange={setTab}>
          {SERVICE_TABS.map((t) => (
            <TabPanel key={t.id} id={t.id} value={tab}>
              {t.id === 'operations' ? (
                <div className="sb-col">
                  <OperationList label="Operations of API Pastry 2.0">
                    {OPERATIONS.map((op, i) => (
                      <OperationRow key={`${op.method}${op.path}`} {...op} selected={sel === i} onSelect={() => setSel(i)} />
                    ))}
                  </OperationList>
                  <Panel title="About" headingLevel={2}>
                    <DescriptionList
                      items={[
                        { term: 'Mock base URL', value: MOCK_BASE, mono: true },
                        { term: 'Dispatcher', value: 'URI_PARTS', mono: true },
                        { term: 'Source', value: 'openapi.yaml · imported 3 days ago' },
                      ]}
                    />
                  </Panel>
                </div>
              ) : (
                <p style={{ margin: 0 }}>Content of the {t.label} tab.</p>
              )}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    );
  },
};
