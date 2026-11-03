import { Component, Host, Prop, h } from '@stencil/core';
import { icon } from '../../utils/icons';

/** Inline stroke icon, 2px stroke, currentColor. Decorative unless `label` is set. */
@Component({
  tag: 'mk-icon',
  shadow: true,
  styles: `:host { display: inline-flex; line-height: 0; }`,
})
export class MkIcon {
  /** cockpit, apis, upload, tests, sources, usage, traces, hub, admin, plugin, check, cross, warning, running, circle, spark, search, copy, sun, moon, chevron, user. */
  @Prop() name = 'circle';
  @Prop() size = 16;
  /** Accessible name. Without it, the icon is hidden from assistive tech. */
  @Prop() label?: string;

  render() {
    return (
      <Host role={this.label ? 'img' : undefined} aria-label={this.label} aria-hidden={this.label ? undefined : 'true'}>
        {icon(this.name, this.size)}
      </Host>
    );
  }
}
