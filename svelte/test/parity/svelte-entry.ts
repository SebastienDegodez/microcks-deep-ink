import { mount } from 'svelte';
import { prepare, ready } from './runtime';
import NativeStory from './NativeStory.svelte';
import { modules } from './.artifacts/svelte-modules';
try {
  const { meta, story, args, context, frame } = await prepare(modules);
  const render = (typeof story === 'function' ? story : story.render) ?? meta.render ?? ((props: any) => ({ Component: meta.component, props }));
  const normalize = (result: any) => {
    const value = result?.default ?? result;
    if (!value || Object.keys(value).length === 0) return { Component: meta.component, props: args };
    return value.Component ? value : { Component: value, props: args };
  };
  let decorated = (updated = context): any => normalize(render(updated.args, updated));
  for (const decorator of [...(story.decorators ?? []), ...(meta.decorators ?? [])]) {
    const previous = decorated;
    decorated = (updated = context) => {
      let inner: any;
      const outer = decorator((changes: any = {}) => {
        inner = previous({ ...updated, ...changes, args: { ...updated.args, ...changes.args } });
        return inner;
      }, updated);
      inner ??= previous(updated);
      return outer === inner ? inner : { ...normalize(outer), inner };
    };
  }
  mount(NativeStory, { target: frame, props: { result: decorated({ ...context, args }) } });
  await ready();
} catch (error) { (window as any).__parityError = String(error); }
