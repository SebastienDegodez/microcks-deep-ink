import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { ResultBox } from '@microcks-deep-ink/registry/react/result-box';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ResultBox',
  parameters: itemParams(['result-box', 'button'], 'A framed result line in a role="status" box. Keep it mounted before the result arrives so the text is announced; the tone icon is decorative.'),
} satisfies Meta;

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
        <ResultBox tone="info" action={<Button size="sm">Undo</Button>}>
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
