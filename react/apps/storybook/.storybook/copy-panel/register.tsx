// Copy panel of the React Storybook, forked from apps/shared/copy-panel: React is a package now
// (@microcks/deep-ink), so the panel shows the import to write, and the HTML recipe the CLI copies.
// Forked rather than shared so that `storybook/manager-api` resolves to this Storybook's own copy.
//
// Stories declare what to copy: `parameters: { deepInk: { items: ['button'] } }`.
// `preview` sets `globals.framework`, which the panel prefers over the registration default.
import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { AddonPanel } from 'storybook/internal/components';
import { CopyPanel } from './Panel';
import type { CopyFramework } from '../../../../../apps/shared/copy-panel/model';


export const COPY_PANEL_ID = 'deep-ink/copy';

export interface CopyPanelOptions {
  framework: CopyFramework;
}

/** Registers the Copy panel. Select it by default with `parameters.options.selectedPanel = 'deep-ink/copy'`. */
export function registerCopyPanel({ framework }: CopyPanelOptions): void {
  addons.add(COPY_PANEL_ID, {
    type: types.PANEL,
    title: 'Copy',
    paramKey: 'deepInk',
    render: ({ active }) => (
      <AddonPanel active={Boolean(active)}>
        <CopyPanel framework={framework} />
      </AddonPanel>
    ),
  });
}
