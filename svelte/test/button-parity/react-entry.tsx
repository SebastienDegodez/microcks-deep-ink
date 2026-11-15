import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Button, ButtonLink } from '../../../react/packages/deep-ink/src/button';
import type { ButtonProps, ButtonLinkProps } from '../../../react/packages/deep-ink/src/button';
import cases from './.artifacts/cases.json';

const body = cases.map((entry) => {
  const { disabled, ...props } = entry.props as ButtonProps;
  const children = props.iconOnly ? undefined : ['Save ', createElement('strong', { key: 'content' }, 'changes')];
  // React expresses disabled links using aria-disabled, not a disabled prop.
  // Loading markup is untouched; native navigation safety is verified separately.
  const control = entry.kind === 'button'
    ? createElement(Button, { ...props, disabled }, children)
    : createElement(ButtonLink, { ...props, href: '#destination',
      'aria-disabled': disabled ? true : undefined } as ButtonLinkProps, children);
  return `<section class="case" id="${entry.id}">${renderToStaticMarkup(control)}</section>`;
}).join('');
writeFileSync('.artifacts/react.html', `<!doctype html><html lang="en"><head><link rel="stylesheet" href="common.css"></head><body>${body}</body></html>`);
