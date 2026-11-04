import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Chip, type Protocol } from '@microcks-deep-ink/registry/react/chip';
import { itemParams } from './_meta';

export default {
  title: 'Components/Chip',
  parameters: itemParams(['chip'], 'Static labels are a `<span>`. A chip with `pressed` is a toggle `<button aria-pressed>`. A removable chip has a remove button named "Remove <text>".'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <Chip>neutral</Chip>
      <Chip tone="info">info</Chip>
      <Chip tone="success">success</Chip>
      <Chip tone="warning">warning</Chip>
      <Chip tone="danger">danger</Chip>
    </div>
  ),
};

/** `removeLabel` names the remove button: it reads "Remove REST filter". */
export const RemoveLabel: StoryObj = {
  name: 'Remove button label',
  render: () => (
    <div className="inline">
      <Chip tone="info" onRemove={() => undefined} removeLabel="Remove REST filter">REST</Chip>
      <Chip tone="neutral" variant="outline" size="sm" onRemove={() => undefined} removeLabel="Remove team filter">Team: Bakery</Chip>
    </div>
  ),
};

export const Variants: StoryObj = {
  render: () => (
    <div className="inline">
      <Chip variant="solid" tone="info">solid</Chip>
      <Chip variant="outline" tone="info">outline</Chip>
      <Chip variant="dashed" tone="warning">Proposed · beyond POC</Chip>
      <Chip labelKey="owner">sebastien</Chip>
    </div>
  ),
};

export const Toggle: StoryObj = {
  render: () => {
    const [on, setOn] = useState(false);
    return <Chip pressed={on} onClick={() => setOn(!on)}>REST only</Chip>;
  },
};

export const Removable: StoryObj = {
  render: () => {
    const [tags, setTags] = useState(['pastry', 'bakery', 'v2']);
    return (
      <div className="inline">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>{t}</Chip>
        ))}
        {tags.length === 0 ? <span className="sb-note">No tags left.</span> : null}
      </div>
    );
  },
};

export const Filters: StoryObj = {
  name: 'Filters (labels and protocols)',
  render: () => {
    const [label, setLabel] = useState('domain=pastry');
    const [proto, setProto] = useState<string | null>('REST');
    const protos: Array<[Protocol, number]> = [['REST', 4], ['SOAP', 1], ['EVENT', 2], ['GRAPHQL', 0]];
    return (
      <div className="stack">
        <div className="inline">
          {protos.map(([p, n]) => (
            <Chip key={p} protocol={p} count={n} pressed={proto === p} onClick={() => setProto(proto === p ? null : p)}>{p}</Chip>
          ))}
        </div>
        <div className="inline">
          {[['domain', 'pastry', 4], ['domain', 'movies', 1], ['status', 'GA', 4]].map(([k, v, n]) => (
            <Chip key={`${k}=${v}`} labelKey={String(k)} count={Number(n)} pressed={label === `${k}=${v}`} onClick={() => setLabel(`${k}=${v}`)}>{v}</Chip>
          ))}
        </div>
        <div className="inline" role="group" aria-label="Categories">
          {[['All', 8], ['Samples', 3], ['Banking', 1]].map(([c, n]) => (
            <Chip key={String(c)} size="lg" count={Number(n)} pressed={c === 'All'}>{c}</Chip>
          ))}
        </div>
        <div className="inline">
          <Chip size="sm" labelKey="domain">pastry</Chip>
          <Chip size="sm" labelKey="team">bakery</Chip>
        </div>
      </div>
    );
  },
};
