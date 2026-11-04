import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MethodTag } from '@microcks-deep-ink/registry/react/method-tag';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/MethodTag',
  parameters: itemParams(['method-tag'], 'The operation verb in mono, always written out. The color only speeds up scanning.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <MethodTag key={m} method={m} />)}
      <MethodTag method="SUBSCRIBE" protocol="EVENT" />
      <MethodTag method="PUBLISH" protocol="EVENT" />
    </div>
  ),
};

export const AlignedInAList: StoryObj = {
  name: 'Aligned in a list',
  render: () => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[['GET', '/pastries'], ['PATCH', '/pastries/{name}'], ['DELETE', '/pastries/{name}']].map(([m, p]) => (
        <li key={m} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MethodTag method={m!} minWidth={52} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{p}</span>
        </li>
      ))}
    </ul>
  ),
};

export const Small: StoryObj = {
  name: 'Small and extra small',
  render: () => (
    <div className="inline">
      <MethodTag method="GET" size="sm" />
      <MethodTag method="PATCH" size="sm" />
      <MethodTag method="POST" size="sm" />
      <MethodTag method="GET" size="xs" />
      <MethodTag method="PATCH" size="xs" />
    </div>
  ),
};
