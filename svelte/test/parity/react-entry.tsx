import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { prepare, ready } from './runtime';
import { modules } from './.artifacts/react-modules';
try {
  const { meta, story, args, context, frame } = await prepare(modules);
  const render = (typeof story === 'function' ? story : story.render) ?? meta.render ?? ((props: any) => React.createElement(meta.component, props));
  let decorated = (updated = context) => render(updated.args, updated);
  for (const decorator of [...(story.decorators ?? []), ...(meta.decorators ?? [])]) {
    const inner = decorated;
    decorated = (updated = context) => decorator((changes: any = {}) => React.createElement(() => inner({ ...updated, ...changes, args: { ...updated.args, ...changes.args } })), updated);
  }
  flushSync(() => createRoot(frame).render(React.createElement(() => decorated({ ...context, args }))));
  await ready();
} catch (error) { (window as any).__parityError = String(error); }
