// Deep Ink · description-list@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes, ReactNode } from 'react';

export interface DescriptionItem {
  term: string;
  value: ReactNode;
  mono?: boolean;
}

export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  items: DescriptionItem[];
}

export function DescriptionList({ items, className, ...rest }: DescriptionListProps) {
  return (
    <dl {...rest} className={['dl', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd data-mono={item.mono ? '' : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
