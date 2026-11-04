import type { ElementType, HTMLAttributes, ReactNode } from 'react';

export interface ExchangeBlock {
  /** Accessible name of the block ("Request line", "Response body"). */
  label: string;
  text: string;
  /** `secondary` (request line), `params` (warning), `headers` (muted), `body` (default, --text). */
  tone?: 'secondary' | 'params' | 'headers' | 'body';
  /** Fills the remaining height of the card. */
  grow?: boolean;
}

export interface ExchangeCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Head title, uppercase in CSS: "Request", "Response". */
  title: string;
  /** Accessible name of the card: "Request of Eclair Cafe". */
  label: string;
  /** Mono text at the end of the head (the example name). */
  meta?: ReactNode;
  /** Filled status at the end of the head: "200 OK". */
  status?: ReactNode;
  statusTone?: 'success' | 'warning' | 'danger';
  blocks: ExchangeBlock[];
  /** `md` (default, Service) or `sm` (Copilot compact head). */
  size?: 'md' | 'sm';
  /** Level of the title heading; `none` renders a span. */
  headingLevel?: 3 | 4 | 5 | 6 | 'none';
}

/** One side of an exchange: a small head over stacked mono blocks. */
export function ExchangeCard({ title, label, meta, status, statusTone = 'success', blocks, size = 'md', headingLevel = 4, className, ...rest }: ExchangeCardProps) {
  const Title = (headingLevel === 'none' ? 'span' : `h${headingLevel}`) as ElementType;
  return (
    <section {...rest} aria-label={label} className={['exchange-card', className].filter(Boolean).join(' ')} data-size={size === 'sm' ? 'sm' : undefined}>
      <div className="exchange-card-head">
        <Title className="exchange-card-title">{title}</Title>
        {meta ? <span className="exchange-card-meta">{meta}</span> : null}
        {status ? (
          <span className="exchange-card-status" data-tone={statusTone === 'success' ? undefined : statusTone}>
            {status}
          </span>
        ) : null}
      </div>
      {blocks.map((b, i) => (
        // A block can scroll, so it is focusable and named (WCAG 2.1.1).
        <pre key={i} role="region" aria-label={b.label} tabIndex={0} data-tone={b.tone && b.tone !== 'body' ? b.tone : undefined} data-grow={b.grow ? '' : undefined}>
          {b.text}
        </pre>
      ))}
    </section>
  );
}

export interface ExchangeProps extends HTMLAttributes<HTMLDivElement> {
  /** Draws a decorative ⇄ between the two cards. */
  separator?: boolean;
  /** Exactly two ExchangeCards: request, then response. */
  children: [ReactNode, ReactNode];
}

/** A request and its response side by side. */
export function Exchange({ separator = true, className, children, ...rest }: ExchangeProps) {
  return (
    <div {...rest} className={['exchange', className].filter(Boolean).join(' ')}>
      {children[0]}
      {separator ? (
        <div className="exchange-sep" aria-hidden="true">
          ⇄
        </div>
      ) : null}
      {children[1]}
    </div>
  );
}
