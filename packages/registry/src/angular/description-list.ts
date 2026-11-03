import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DescriptionItem {
  term: string;
  value: string | number;
  mono?: boolean;
}

/** `<dl>` of term and value pairs: `<dl mkDescriptionList [items]="items"></dl>`. */
@Component({
  selector: 'dl[mkDescriptionList]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'di-dl' },
  template: `@for (item of items(); track item.term) {<div><dt>{{ item.term }}</dt><dd [attr.data-mono]="item.mono ? '' : null">{{ item.value }}</dd></div>}`,
})
export class DescriptionListComponent {
  readonly items = input.required<DescriptionItem[]>();
}
