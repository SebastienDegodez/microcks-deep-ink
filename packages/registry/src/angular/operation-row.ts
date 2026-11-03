import { booleanAttribute, ChangeDetectionStrategy, Component, Directive, input, output } from '@angular/core';
import { MethodTagComponent } from './method-tag';
import type { Protocol } from './method-tag';
import { MockUrlComponent } from './mock-url';

/** `<ul mkOperationList label="Operations of API Pastry 2.0">`: a named list of operation rows. */
@Directive({
  selector: 'ul[mkOperationList]',
  host: { class: 'operation-list', '[attr.aria-label]': 'label()' },
})
export class OperationListDirective {
  /** Accessible name of the list, e.g. "Operations of API Pastry 2.0". */
  readonly label = input.required<string>();
}

/**
 * One operation: a link (`href`), a button (`interactive` + `rowSelect`) or static.
 * Selected is `aria-current="true"`; the mock URL is revealed under a selected row.
 */
@Component({
  selector: 'li[mkOperationRow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MethodTagComponent, MockUrlComponent],
  host: { class: 'operation-row', '[attr.data-selected]': "selected() ? '' : null" },
  template: `
    @if (href()) {
      <a class="operation-link" [attr.href]="href()" [attr.aria-current]="selected() ? 'true' : null">
        <span mkMethodTag [method]="method()" [protocol]="protocol()"></span>
        <span class="operation-path">{{ path() }}</span>
        @if (meta()) {
          <span class="operation-meta">{{ meta() }}</span>
        }
      </a>
    } @else if (interactive()) {
      <button type="button" class="operation-link" [attr.aria-current]="selected() ? 'true' : null" (click)="rowSelect.emit()">
        <span mkMethodTag [method]="method()" [protocol]="protocol()"></span>
        <span class="operation-path">{{ path() }}</span>
        @if (meta()) {
          <span class="operation-meta">{{ meta() }}</span>
        }
      </button>
    } @else {
      <div class="operation-link">
        <span mkMethodTag [method]="method()" [protocol]="protocol()"></span>
        <span class="operation-path">{{ path() }}</span>
        @if (meta()) {
          <span class="operation-meta">{{ meta() }}</span>
        }
      </div>
    }
    @if (selected() && mockUrl()) {
      <div class="operation-mock"><mk-mock-url [url]="mockUrl()!" [method]="method()" bare /></div>
    }
  `,
})
export class OperationRowComponent {
  readonly method = input.required<string>();
  readonly path = input.required<string>();
  readonly protocol = input<Protocol>('REST');
  /** Right-aligned metadata, e.g. "3 examples · URI_PARTS". */
  readonly meta = input<string>();
  /** Revealed under the row when it is selected. */
  readonly mockUrl = input<string>();
  readonly selected = input(false, { transform: booleanAttribute });
  /** Renders a link. */
  readonly href = input<string>();
  /** Renders a button that emits `rowSelect`. Without `href` or `interactive` the row is static. */
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly rowSelect = output<void>();
}
