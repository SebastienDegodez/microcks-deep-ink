import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks/deep-ink';
import { ResultBox } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ResultBox',
  component: ResultBox,
  parameters: itemParams(['result-box', 'button'], 'A framed result line in a role="status" box. Keep it mounted before the result arrives so the text is announced; the tone icon is decorative.'),
} satisfies Meta<typeof ResultBox>;

export const Tones: StoryObj = {
  render: () => {
    const [shown, setShown] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        <div>{shown ? <ResultBox size="md" onDismiss={() => setShown(false)}>Secret gitlab-bakery created.</ResultBox> : <Button size="sm" onClick={() => setShown(true)}>Show the toast again</Button>}</div>
        <ResultBox action={<a href="#/services">Open the Catalogue</a>}>Imported · 1 created, 2 replaced</ResultBox>
        <ResultBox tone="neutral" title="checkout-beer cannot run until beerCatalog is linked" action={<Button size="sm" icon="link">Link source</Button>}>
          Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link in the dialog.
        </ResultBox>
        <ResultBox tone="info" density="compact" action={<Button variant="outline" size="xs" tone="link">Undo</Button>}>
          <strong>Pastry orders events</strong> deleted. Services already discovered remain but are no longer updated.
        </ResultBox>
        <ResultBox tone="danger">Export failed · the repository is read-only.</ResultBox>
      </div>
    );
  },
};

/** `tone="warning"`, a custom `icon`, `dismissLabel`, and `live="off"` for a box that is already on screen at load. */
export const WarningDismissible: StoryObj = {
  name: 'Warning, dismissible, not announced',
  render: () => {
    const [shown, setShown] = useState(true);
    return shown ? (
      <div style={{ maxWidth: 560 }}>
        <ResultBox tone="warning" icon="spark" title="Partial result" live="off" onDismiss={() => setShown(false)} dismissLabel="Dismiss the partial result">
          2 of 12 operations were skipped.
        </ResultBox>
      </div>
    ) : <Button onClick={() => setShown(true)}>Show the result again</Button>;
  },
};

/** `bordered={false}` and `surface="raised"`: a flat note on the raised fill, as the Agent test verdict. */
export const FlatRaised: StoryObj = {
  name: 'Not bordered, raised (verdict)',
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <ResultBox tone="danger" icon="cross" title="The agent answered a canceled task" bordered={false} surface="raised" live="off">
        tasks/cancel returned 200, then message/send on the same task id returned a new artifact. A canceled task must stay terminal.
      </ResultBox>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ResultBox> = {
  args: { tone: 'success', size: 'md', title: 'Test passed', children: 'All 12 operations match the contract.', icon: undefined, dismissLabel: 'Dismiss', live: 'status', bordered: true, surface: 'surface', density: 'regular' },
  argTypes: {
    tone: { control: 'select', options: ['success', 'warning', 'danger', 'neutral', 'info'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    live: { control: 'inline-radio', options: ['status', 'off'] },
    surface: { control: 'inline-radio', options: ['surface', 'raised'] },
    density: { control: 'inline-radio', options: ['regular', 'compact'] },
    onDismiss: { table: { disable: true } },
  },
};
