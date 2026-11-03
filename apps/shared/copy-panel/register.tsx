// Entry point of the shared Copy panel, imported by the manager of each Storybook:
//
//   // .storybook/manager.ts
//   import { registerCopyPanel } from '@microcks-deep-ink/storybook-shared/copy-panel';
//   registerCopyPanel({ framework: 'react' }); // or 'angular'
//
// Stories declare what to copy: `parameters: { deepInk: { items: ['button'] } }`.
// `preview` sets `globals.framework`, which the panel prefers over the registration default.
import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { AddonPanel } from 'storybook/internal/components';
import { CopyPanel } from './Panel';
import type { CopyFramework } from './model';

export { a11yDoc } from './a11y-doc';
export type { CopyFramework, DeepInkParameter } from './model';

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
