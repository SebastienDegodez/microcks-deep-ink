import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks-deep-ink/registry/react/split-pane';
import { itemParams } from './_meta';
import { Panel } from '@microcks-deep-ink/registry/react/panel';

export default {
  title: 'Microcks/SplitPane',
  component: SplitPane,
  parameters: itemParams(['split-pane'], 'List + detail layout. The side pane grows to a cap, the main pane takes the rest and wraps under the list on narrow screens. The DOM order is the reading order.'),
} satisfies Meta<typeof SplitPane>;

const box: React.CSSProperties = { padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--canvas)' };

export const ListAndDetail: StoryObj = {
  name: 'List and detail',
  render: () => (
    <SplitPane>
      <SplitPaneSide as="nav" aria-label="Operations" style={box}>GET /pastries · GET /pastries/{'{name}'} · PATCH /pastries/{'{name}'}</SplitPaneSide>
      <SplitPaneMain as="section" aria-label="Operation detail" style={box}>Examples, request and response of the selected operation.</SplitPaneMain>
    </SplitPane>
  ),
};

/** `align="stretch"` makes both panes as tall as the taller one; `balanced` shares the width; `gap` sets the spacing. */
export const StretchAndBalanced: StoryObj = {
  name: 'Stretch, balanced and gap',
  render: () => (
    <SplitPane align="stretch" balanced gap="32px">
      <SplitPaneSide as="nav" aria-label="Operations"><Panel title="Operations"><p>Short list</p></Panel></SplitPaneSide>
      <SplitPaneMain><Panel title="Detail"><p>The detail pane is longer.</p><p>Both panes end on the same line.</p></Panel></SplitPaneMain>
    </SplitPane>
  ),
};

export const DetailFirst: StoryObj = {
  name: 'Wide list, detail on the right (Traces, Hub)',
  render: () => (
    <SplitPane sideWidth="400px" sideMax="560px" mainWidth="560px">
      <SplitPaneMain as="section" aria-label="Calls" style={box}>The list of calls takes the rest of the row.</SplitPaneMain>
      <SplitPaneSide as="aside" aria-label="Call detail" style={box}>The detail of the selected call.</SplitPaneSide>
    </SplitPane>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SplitPane> = {
  args: {
    sideWidth: '280px', sideMax: undefined, mainWidth: undefined, gap: undefined, align: 'start', balanced: false,
    children: (
      <>
        <SplitPaneSide as="nav"><Panel title="Services"><p>List</p></Panel></SplitPaneSide>
        <SplitPaneMain><Panel title="Detail"><p>Detail of the selected item.</p></Panel></SplitPaneMain>
      </>
    ),
  },
  argTypes: { align: { control: 'inline-radio', options: ['start', 'stretch'] } },
};
