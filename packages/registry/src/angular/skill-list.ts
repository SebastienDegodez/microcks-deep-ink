import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon';

export interface SkillItem {
  /** Skill id from the Agent Card: `order-pastry`. */
  id: string;
  name: string;
  /** Calls in the last 24 h. */
  calls?: number;
  tags?: string[];
  /** "2 conversations" */
  meta?: string;
  /** Result of the last test of this skill. */
  result?: 'pass' | 'fail';
  /** One sentence for the result, read after the word: "HTTP+JSON resumed input-required on a new taskId". */
  resultNote?: string;
  /** The catch-all entry (no skill matched): dashed outline. */
  fallback?: boolean;
}

/**
 * Skills of an Agent Card, as served by the mock. Each item gives the id, the name, the call count, the tags and
 * the last test result. A `selectable` list uses `aria-pressed`, not tabs: the detail sits in its own region.
 */
@Component({
  selector: 'ul[mkSkillList]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: { class: 'skill-list', '[attr.aria-label]': 'label()' },
  template: `
    @for (s of skills(); track s.id) {
      <li class="skill-item-row" [attr.data-fallback]="s.fallback ? '' : null">
        @if (selectable()) {
          <button type="button" class="skill-item" [attr.data-variant]="s.fallback ? 'fallback' : null" [attr.aria-pressed]="selectedId() === s.id" (click)="skillSelect.emit(s.id)">
            <ng-container *ngTemplateOutlet="body; context: { $implicit: s }" />
          </button>
        } @else {
          <div class="skill-item" [attr.data-variant]="s.fallback ? 'fallback' : null">
            <ng-container *ngTemplateOutlet="body; context: { $implicit: s }" />
          </div>
        }
      </li>
    }
    <ng-template #calls let-s>
      @if (s.calls !== undefined) {
        <span class="skill-item-calls">{{ s.calls }}<span class="sr-only"> calls in 24 hours</span></span>
      }
    </ng-template>
    <ng-template #result let-s>
      @if (s.result) {
        <span class="skill-item-result" [attr.data-result]="s.result">
          <svg mkIcon [name]="s.result === 'pass' ? 'check' : 'cross'" [size]="12"></svg>
          {{ s.result === 'pass' ? 'passed' : 'failed' }}
          @if (s.resultNote) {
            <span class="sr-only">: {{ s.resultNote }}</span>
          }
        </span>
      }
    </ng-template>
    <ng-template #body let-s>
      @if (s.fallback) {
        <span class="skill-item-head">
          <span class="skill-item-title">{{ s.name }}</span>
          <ng-container *ngTemplateOutlet="calls; context: { $implicit: s }" />
        </span>
        @if (fallbackLine(s); as line) {
          <span class="skill-item-line">{{ line }}</span>
        }
        @if (s.result) {
          <span class="skill-item-foot"><ng-container *ngTemplateOutlet="result; context: { $implicit: s }" /></span>
        }
      } @else {
        <span class="skill-item-head">
          <span class="skill-item-id">{{ s.id }}</span>
          <ng-container *ngTemplateOutlet="calls; context: { $implicit: s }" />
        </span>
        @if (s.name) {
          <span class="skill-item-name">{{ s.name }}</span>
        }
        @if (s.tags?.length || s.meta || s.result) {
          <span class="skill-item-foot">
            @for (t of s.tags ?? []; track t) {
              <span class="skill-item-tag">{{ t }}</span>
            }
            @if (s.meta) {
              <span class="skill-item-meta">{{ s.meta }}</span>
            }
            <ng-container *ngTemplateOutlet="result; context: { $implicit: s }" />
          </span>
        }
      }
    </ng-template>
  `,
})
export class SkillListComponent {
  /** Accessible name of the list: "Skills of Pastry concierge 1.0". */
  readonly label = input.required<string>();
  readonly skills = input.required<SkillItem[]>();
  readonly selectedId = input<string>();
  /** Makes the items toggle buttons (`aria-pressed`) that emit `skillSelect`. Without it the list is read-only. */
  readonly selectable = input(false);
  readonly skillSelect = output<string>();

  protected fallbackLine(s: SkillItem): string {
    return [...(s.tags ?? []), ...(s.meta ? [s.meta] : [])].join(' · ');
  }
}
