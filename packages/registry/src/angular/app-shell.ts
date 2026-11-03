import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, signal, TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ButtonDirective } from './button';
import { IconComponent } from './icon';
import type { IconName } from './icon';

export interface ShellNavItem {
  id: string;
  label: string;
  href: string;
  /** Icon name from the icon item. */
  icon?: IconName;
  badge?: string;
}

/**
 * Context of the `linkTemplate` (router links). Render your link with the `di-sidenav-link` class,
 * `[attr.aria-current]="current"`, `(click)="navigate()"`, and put the item content inside it:
 * `<ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ $implicit: item }" />`.
 */
export interface ShellLinkContext {
  $implicit: ShellNavItem;
  current: 'page' | null;
  content: TemplateRef<unknown>;
  navigate: () => void;
}

let nextId = 0;

/**
 * Skip link, banner, navigation and main landmarks. Below 768px the nav sits behind a Menu
 * disclosure button. Slots: `[mkShellBrand]`, `[mkShellActions]`, `[mkShellBanner]`; the page goes in the default slot.
 */
@Component({
  selector: 'mk-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, IconComponent, NgTemplateOutlet],
  host: { class: 'di-shell', '(document:keydown.escape)': 'onEscape()' },
  template: `
    <!-- A hash router would treat href="#main" as a route: focus the element instead of navigating. -->
    <a class="di-skip-link" href="#main" (click)="skip($event)">{{ skipLinkLabel() }}</a>
    <header class="di-topbar">
      <button #menuButton type="button" mkButton variant="ghost" class="di-shell-menu" [attr.aria-expanded]="open()" [attr.aria-controls]="navId" (click)="open.set(!open())">
        <svg mkIcon [name]="open() ? 'close' : 'menu'" [size]="18"></svg>
        Menu
      </button>
      <div class="di-topbar-brand">{{ brand() }}<ng-content select="[mkShellBrand]" /></div>
      <div class="di-topbar-actions"><ng-content select="[mkShellActions]" /></div>
    </header>
    <div class="di-shell-banner"><ng-content select="[mkShellBanner]" /></div>
    <nav class="di-sidenav" [id]="navId" [attr.aria-label]="navLabel()" [attr.data-open]="open() ? 'true' : 'false'">
      <ul>
        @for (item of nav(); track item.id) {
          <li>
            @if (linkTemplate(); as tpl) {
              <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="linkContext(item)" />
            } @else {
              <a class="di-sidenav-link" [attr.href]="item.href" [attr.aria-current]="item.id === activeId() ? 'page' : null" (click)="open.set(false)">
                <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ $implicit: item }" />
              </a>
            }
          </li>
        }
      </ul>
    </nav>
    <main #main id="main" tabindex="-1" class="di-main"><ng-content /></main>
    <ng-template #content let-item>
      @if (item.icon) {
        <svg mkIcon [name]="item.icon" [size]="18"></svg>
      }
      <span>{{ item.label }}</span>
      @if (item.badge) {
        <span class="di-sidenav-badge">{{ item.badge }}</span>
      }
    </ng-template>
  `,
})
export class AppShellComponent {
  /** Brand text. Use the `[mkShellBrand]` slot for richer content. */
  readonly brand = input<string>('');
  readonly nav = input.required<ShellNavItem[]>();
  readonly activeId = input.required<string>();
  readonly skipLinkLabel = input('Skip to content');
  readonly navLabel = input('Main');
  /** Render nav links with your router: see `ShellLinkContext`. */
  readonly linkTemplate = input<TemplateRef<ShellLinkContext>>();

  protected readonly open = signal(false);
  protected readonly navId = `mk-shell-nav-${++nextId}`;
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly menuButton = viewChild.required<ElementRef<HTMLElement>>('menuButton');
  private readonly content = viewChild.required<TemplateRef<unknown>>('content');

  constructor() {
    // Leaving the narrow layout resets the disclosure.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!window.matchMedia) return;
      const mq = window.matchMedia('(max-width: 767px)');
      const reset = () => {
        if (!mq.matches) this.open.set(false);
      };
      mq.addEventListener?.('change', reset);
      destroyRef.onDestroy(() => mq.removeEventListener?.('change', reset));
    });
  }

  protected linkContext(item: ShellNavItem): ShellLinkContext {
    return {
      $implicit: item,
      current: item.id === this.activeId() ? 'page' : null,
      content: this.content(),
      navigate: () => this.open.set(false),
    };
  }

  protected skip(e: Event): void {
    e.preventDefault();
    this.main().nativeElement.focus();
  }

  /** Escape closes the narrow-screen navigation and returns focus to the Menu button. */
  protected onEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.menuButton().nativeElement.focus();
  }
}
