import { useId } from 'react';
import type { ElementType, HTMLAttributes, ReactNode, Ref } from 'react';

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface TileActionProps {
  className: 'tile-action';
  id: string;
  'aria-current'?: 'true';
  children: ReactNode;
}

export interface TileProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onSelect'> {
  /** Visible name. It names the tile and, when the tile is interactive, it is the one link or button. */
  title: ReactNode;
  /** Level of the title heading. Keep the page outline ordered. */
  headingLevel?: HeadingLevel;
  /** Logo, icon or picture before the title. Decorative unless you give it a name. */
  media?: ReactNode;
  /** One line under the title: "maintained by community · 3 APIs". */
  meta?: ReactNode;
  /** End of the header: a category tag (`<span className="tile-tag">`), a status. */
  aside?: ReactNode;
  /** Footer row: actions and, in `<span className="tile-footer-end">`, totals. */
  footer?: ReactNode;
  /** The title becomes a link stretched over the tile. */
  href?: string;
  /** The title becomes a toggle button stretched over the tile (`aria-pressed` follows `selected`). */
  onSelect?: () => void;
  /** Renders the title link yourself, for router links. Spread `props` on it. */
  renderAction?: (props: TileActionProps) => ReactNode;
  /** Selected tile: action border and selected fill; the link gets `aria-current`, the button `aria-pressed`. */
  selected?: boolean;
  /** Root element: `article` (default) or `li` inside a `<ul className="tile-grid">`. */
  as?: 'article' | 'li' | 'div';
  ref?: Ref<HTMLElement>;
}

/**
 * Card for a package, a service, a workflow or an agent. The whole tile is clickable through one real link or
 * button (the title) stretched over it; other controls in the footer stay separate and keyboard reachable.
 */
export function Tile({
  title,
  headingLevel = 3,
  media,
  meta,
  aside,
  footer,
  href,
  onSelect,
  renderAction,
  selected,
  as = 'article',
  className,
  children,
  ref,
  ...rest
}: TileProps) {
  const titleId = useId();
  const Root = as as ElementType;
  const Heading = `h${headingLevel}` as ElementType;
  const interactive = Boolean(href || onSelect || renderAction);
  const actionProps: TileActionProps = { className: 'tile-action', id: titleId, 'aria-current': selected ? 'true' : undefined, children: title };
  let name: ReactNode;
  if (renderAction) name = renderAction(actionProps);
  else if (href)
    name = (
      <a className="tile-action" id={titleId} href={href} aria-current={actionProps['aria-current']}>
        {title}
      </a>
    );
  else if (onSelect)
    name = (
      <button type="button" className="tile-action" id={titleId} aria-pressed={selected ? 'true' : 'false'} onClick={onSelect}>
        {title}
      </button>
    );
  else name = <span id={titleId}>{title}</span>;

  return (
    <Root
      ref={ref}
      {...rest}
      className={['tile', className].filter(Boolean).join(' ')}
      aria-labelledby={rest['aria-labelledby'] ?? titleId}
      data-interactive={interactive ? '' : undefined}
      data-selected={selected ? '' : undefined}
    >
      <div className="tile-head">
        {media ? <span className="tile-media">{media}</span> : null}
        <div className="tile-heading">
          <Heading className="tile-title">{name}</Heading>
          {meta ? <span className="tile-meta">{meta}</span> : null}
        </div>
        {aside ? <span className="tile-aside">{aside}</span> : null}
      </div>
      {children ? <div className="tile-body">{children}</div> : null}
      {footer ? <div className="tile-footer">{footer}</div> : null}
    </Root>
  );
}

export interface TileGridProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name of the group: "Packages". */
  label: string;
  /** `section` (default) holds `article` tiles; `ul` holds `li` tiles. */
  as?: 'section' | 'ul' | 'div';
}

/** Wrapping grid of tiles, 12px apart, each tile at least 300px wide. */
export function TileGrid({ label, as = 'section', className, children, ...rest }: TileGridProps) {
  const Root = as as ElementType;
  return (
    <Root {...rest} aria-label={label} role={as === 'div' ? 'group' : undefined} className={['tile-grid', className].filter(Boolean).join(' ')}>
      {children}
    </Root>
  );
}
