import React, { Fragment, useContext } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { DocsContext, Source, Unstyled } from '@storybook/addon-docs/blocks';
import { NAVIGATE_URL } from 'storybook/internal/core-events';
import { toId } from 'storybook/internal/csf';
import { itemsOfTier, type RegistryTier } from './registry-items';

/** Docs page of a Storybook title ("Components/Button" -> ?path=/docs/components-button--docs). */
function docsHref(title: string): string {
  return `?path=/docs/${toId(title, 'docs')}`;
}

const SURFACE = { background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, margin: '16px 0 0' } as const;

/** A link to another Docs page: like the MDX anchors, a plain click navigates the manager, not the preview iframe. */
function DocsLink({ title }: { title: string }) {
  const { channel } = useContext(DocsContext);
  const href = docsHref(title);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    channel.emit(NAVIGATE_URL, href);
  };
  return (
    <a className="link" href={href} onClick={onClick}>
      {title.split('/').pop()}
    </a>
  );
}

/**
 * The items of a tier, read at build time from packages/registry/items/*.json (`tier`, `title`, `description`,
 * `stories`): adding or moving an item updates the Usage pages without editing them.
 */
export function TierItems({ tier, caption }: { tier: RegistryTier; caption: string }) {
  const items = itemsOfTier(tier);
  const captionId = `deep-ink-tier-${tier}`;
  return (
    <Unstyled>
      <div className="table-wrap" role="region" aria-labelledby={captionId} tabIndex={0} style={SURFACE}>
        <table className="table" data-header="sentence">
          <caption id={captionId}>
            {caption} ({items.length} items)
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Registry name</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name}>
                <th scope="row">
                  {item.stories?.length
                    ? item.stories.map((title, i) => (
                        <Fragment key={title}>
                          {i > 0 ? ', ' : null}
                          <DocsLink title={title} />
                        </Fragment>
                      ))
                    : item.title}
                </th>
                <td data-nowrap="">
                  <code>{item.name}</code>
                </td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Unstyled>
  );
}

/** A live composition rendered with the real package, followed by its source (the example file, imported raw). */
export function UsageExample({ code, children }: { code: string; children: ReactNode }) {
  return (
    <>
      <Unstyled>
        <div className="deep-ink-usage-example" style={{ ...SURFACE, padding: 24 }}>
          {children}
        </div>
      </Unstyled>
      <Source code={code.trim()} language="html" dark />
    </>
  );
}
