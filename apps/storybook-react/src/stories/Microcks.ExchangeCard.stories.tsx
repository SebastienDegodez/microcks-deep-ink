import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Exchange, ExchangeCard } from '@microcks-deep-ink/registry/react/exchange-card';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ExchangeCard',
  parameters: itemParams(['exchange-card'], 'A request and its response: named cards with a small head (example name or status) over focusable mono blocks. The status is written; its fill only speeds up scanning.'),
} satisfies Meta;

const BODY = `{
  "name": "Eclair Cafe",
  "description": "Delicieux Eclair au Cafe pas calorique du tout",
  "size": "M",
  "price": 2.5,
  "status": "available"
}`;

export const ServiceExample: StoryObj = {
  name: 'Service example',
  render: () => (
    <Exchange style={{ maxWidth: 900 }}>
      <ExchangeCard
        title="Request"
        label="Request of Eclair Cafe"
        meta="Eclair Cafe"
        blocks={[
          { label: 'Request line', text: 'GET /rest/API+Pastry/2.0/pastries/Eclair%20Cafe', tone: 'secondary' },
          { label: 'Parameters', text: 'name = Eclair Cafe', tone: 'params' },
        ]}
      />
      <ExchangeCard
        title="Response"
        label="Response of Eclair Cafe"
        status="200 OK"
        blocks={[
          { label: 'Response headers', text: 'Content-Type: application/json', tone: 'headers' },
          { label: 'Response body', text: BODY, grow: true },
        ]}
      />
    </Exchange>
  ),
};

export const Compact: StoryObj = {
  name: 'Compact head (Copilot)',
  render: () => (
    <Exchange separator={false} style={{ maxWidth: 900 }}>
      <ExchangeCard size="sm" title="Request" label="Request of Millefeuille" blocks={[{ label: 'Request line', text: 'GET /pastries/Millefeuille', tone: 'secondary' }, { label: 'Parameters', text: 'name = Millefeuille', tone: 'params' }]} />
      <ExchangeCard size="sm" title="Response" label="Response of Millefeuille" status="200 · application/json" blocks={[{ label: 'Response body', text: BODY, grow: true }]} />
    </Exchange>
  ),
};
