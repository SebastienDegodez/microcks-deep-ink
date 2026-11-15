import type { AnchorHTMLAttributes } from 'react';
import { Icon } from './icon';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Opens in a new tab: adds an icon, a hidden notice and rel="noopener noreferrer". */
  external?: boolean;
  /** Hidden notice read after an external link. */
  externalLabel?: string;
}

export function Link({ external, externalLabel = '(opens in a new tab)', className, children, rel, target, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      className={['link', className].filter(Boolean).join(' ')}
      data-external={external ? '' : undefined}
      target={external ? '_blank' : target}
      rel={external ? 'noopener noreferrer' : rel}
    >
      {children}
      {external ? (
        <>
          <Icon name="external" size={14} />
          {' '}
          <span className="sr-only">{externalLabel}</span>
        </>
      ) : null}
    </a>
  );
}
