import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Exchange, ExchangeCard } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ExchangeCard',
  component: ExchangeCard,
  parameters: itemParams(['exchange-card'], 'A request and its response: named cards with a small head (example name or status) over focusable mono blocks. The status is written; its fill only speeds up scanning.'),
} satisfies Meta<typeof ExchangeCard>;

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

/** `statusTone` colours the status; `headingLevel` fits the card in the page outline (`none` for no heading). */
export const StatusTones: StoryObj = {
  name: 'Status tones and heading level',
  render: () => (
    <div className="sb-col" style={{ maxWidth: 560 }}>
      <ExchangeCard title="Response" label="Response, warning" headingLevel={3} status="200 · slow" statusTone="warning" blocks={[{ label: 'Slow response body', text: '{ "name": "Millefeuille" }' }]} />
      <ExchangeCard title="Response" label="Response, failure" headingLevel="none" status="500" statusTone="danger" blocks={[{ label: 'Error body', text: '{ "error": "boom" }' }]} />
    </div>
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

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ExchangeCard> = {
  args: {
    title: 'GET /pastries/Millefeuille', label: 'Exchange 1', meta: '42 ms', status: '200 OK', statusTone: 'success', size: 'md', headingLevel: 4,
    blocks: [{ label: 'Headers', text: 'Accept: application/json', tone: 'headers' }, { label: 'Body', text: '{ "name": "Millefeuille", "price": 3.9 }', tone: 'body' }],
  },
  argTypes: {
    statusTone: { control: 'inline-radio', options: ['success', 'warning', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    headingLevel: { control: 'inline-radio', options: [3, 4, 5, 6, 'none'] },
  },
};
