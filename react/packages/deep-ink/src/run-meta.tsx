import type { HTMLAttributes, ReactNode } from 'react';

export type RunMetaKind = 'text' | 'mono' | 'url' | 'chip';

export interface RunMetaItem {
  term: ReactNode;
  value: ReactNode;
  /** `mono` (durations), `url` (mono, link colour: wrap it in `<a>` when it navigates), `chip` (runner name). */
  kind?: RunMetaKind;
  /** Muted mono 12px detail after the value: the absolute date after "just now". */
  detail?: ReactNode;
  /** React key; defaults to the term when it is a string. */
  id?: string;
}

export interface RunMetaProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  items: RunMetaItem[];
}

/** The meta line under a run header, in a native `<dl>`. */
export function RunMeta({ items, className, ...rest }: RunMetaProps) {
  return (
    <dl {...rest} className={['run-meta', className].filter(Boolean).join(' ')}>
      {items.map((it, i) => (
        <div key={it.id ?? (typeof it.term === 'string' ? it.term : i)} className="run-meta-item">
          <dt>{it.term}</dt>
          <dd data-kind={it.kind && it.kind !== 'text' ? it.kind : undefined}>{it.value}</dd>
          {it.detail ? <dd className="run-meta-detail">{it.detail}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
