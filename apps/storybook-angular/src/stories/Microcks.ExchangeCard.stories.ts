import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { EXCHANGE_CARD } from '@microcks-deep-ink/registry/angular/exchange-card';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ExchangeCard',
  argTypes: argTypesFor('exchange-card'),
  decorators: [moduleMetadata({ imports: [...EXCHANGE_CARD] })],
  parameters: itemParams(['exchange-card'], 'A request and its response: named cards with a small head (example name or status) over focusable mono blocks. The status is written; its fill only speeds up scanning.'),
};
export default meta;

const BODY = `{
  "name": "Eclair Cafe",
  "size": "M",
  "price": 2.5
}`;

export const ServiceExample: StoryObj = {
  name: 'Service example',
  render: () => ({
    props: {
      req: [
        { label: 'Request line', text: 'GET /rest/API+Pastry/2.0/pastries/Eclair%20Cafe', tone: 'secondary' },
        { label: 'Parameters', text: 'name = Eclair Cafe', tone: 'params' },
      ],
      res: [
        { label: 'Response headers', text: 'Content-Type: application/json', tone: 'headers' },
        { label: 'Response body', text: BODY, grow: true },
      ],
    },
    template: `<div mkExchange style="max-width: 900px"><section mkExchangeCard mkExchangeRequest title="Request" label="Request of Eclair Cafe" meta="Eclair Cafe" [blocks]="req"></section><section mkExchangeCard title="Response" label="Response of Eclair Cafe" status="200 OK" [blocks]="res"></section></div>`,
  }),
};

/** `statusTone` colours the status; `headingLevel` fits the card in the page outline (`none` for no heading). */
export const StatusTones: StoryObj = {
  name: 'Status tones and heading level',
  render: () => ({
    props: { a: [{ label: 'Slow response body', text: '{ "name": "Millefeuille" }' }], b: [{ label: 'Error body', text: '{ "error": "boom" }' }] },
    template: `
      <div class="stack" style="max-width:560px">
        <section mkExchangeCard title="Response" label="Response, warning" [headingLevel]="3" status="200 · slow" statusTone="warning" [blocks]="a"></section>
        <section mkExchangeCard title="Response" label="Response, failure" headingLevel="none" status="500" statusTone="danger" [blocks]="b"></section>
      </div>
    `,
  }),
};

export const Compact: StoryObj = {
  name: 'Compact head (Copilot)',
  render: () => ({
    props: {
      req: [{ label: 'Request line', text: 'GET /pastries/Millefeuille', tone: 'secondary' }, { label: 'Parameters', text: 'name = Millefeuille', tone: 'params' }],
      res: [{ label: 'Response body', text: BODY, grow: true }],
    },
    template: `<div mkExchange [separator]="false" style="max-width: 900px"><section mkExchangeCard mkExchangeRequest size="sm" title="Request" label="Request of Millefeuille" [blocks]="req"></section><section mkExchangeCard size="sm" title="Response" label="Response of Millefeuille" status="200 · application/json" [blocks]="res"></section></div>`,
  }),
};
