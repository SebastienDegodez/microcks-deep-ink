// Deep Ink · operation-row@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { MethodTag, type Protocol } from './method-tag';
import { MockUrl } from './mock-url';

export interface OperationListProps extends HTMLAttributes<HTMLUListElement> {
  /** Accessible name of the list, e.g. "Operations of API Pastry 2.0". */
  label: string;
}

export function OperationList({ label, className, ...rest }: OperationListProps) {
  return <ul {...rest} aria-label={label} className={['di-operation-list', className].filter(Boolean).join(' ')} />;
}

export interface OperationRowProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onSelect'> {
  method: string;
  path: string;
  protocol?: Protocol;
  /** Right-aligned metadata, e.g. "3 examples · URI_PARTS". */
  meta?: string;
  /** Revealed under the row when it is selected. */
  mockUrl?: string;
  selected?: boolean;
  /** Renders a link. */
  href?: string;
  /** Renders a button. Without href or onSelect the row is static. */
  onSelect?: () => void;
}

export function OperationRow({ method, path, protocol = 'REST', meta, mockUrl, selected, href, onSelect, className, ...rest }: OperationRowProps) {
  const content = (
    <>
      <MethodTag method={method} protocol={protocol} />
      <span className="di-operation-path">{path}</span>
      {meta ? <span className="di-operation-meta">{meta}</span> : null}
    </>
  );
  const current = selected ? ('true' as const) : undefined;
  return (
    <li {...rest} className={['di-operation-row', className].filter(Boolean).join(' ')} data-selected={selected ? '' : undefined}>
      {href ? (
        <a className="di-operation-link" href={href} aria-current={current}>
          {content}
        </a>
      ) : onSelect ? (
        <button type="button" className="di-operation-link" aria-current={current} onClick={onSelect}>
          {content}
        </button>
      ) : (
        <div className="di-operation-link">{content}</div>
      )}
      {selected && mockUrl ? (
        <div className="di-operation-mock">
          <MockUrl url={mockUrl} method={method} bare />
        </div>
      ) : null}
    </li>
  );
}
