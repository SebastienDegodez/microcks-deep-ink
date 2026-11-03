import { ChangeDetectionStrategy, Component, DestroyRef, booleanAttribute, computed, inject, input, signal } from '@angular/core';
import { ButtonDirective } from './button';
import type { ButtonSize, ButtonVariant } from './button';

type CopyState = 'idle' | 'copied' | 'failed';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.insetBlockStart = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Copies `value` to the clipboard. A visually hidden polite live region announces
 * "Copied" or "Copy failed", so the result is never visual only.
 */
@Component({
  selector: 'mk-copy-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective],
  styles: [':host { display: contents; }'],
  template: `
    <button
      type="button"
      mkButton
      class="copy-button"
      [variant]="variant()"
      [size]="size()"
      [iconOnly]="iconOnly()"
      [icon]="state() === 'copied' ? 'check' : 'copy'"
      [attr.aria-label]="iconOnly() ? text() : null"
      (click)="copy()"
    >{{ iconOnly() ? '' : text() }}</button>
    <span role="status" aria-live="polite" class="sr-only">{{ message() }}</span>
  `,
})
export class CopyButtonComponent {
  /** Text copied to the clipboard. */
  readonly value = input.required<string>();
  /** Idle label. With `iconOnly` it becomes the accessible name. */
  readonly label = input('Copy');
  /** Label shown for 2 seconds after a successful copy. */
  readonly copiedLabel = input('Copied');
  readonly size = input<ButtonSize>('sm');
  readonly variant = input<ButtonVariant>('secondary');
  readonly iconOnly = input(false, { transform: booleanAttribute });

  protected readonly state = signal<CopyState>('idle');
  protected readonly text = computed(() => (this.state() === 'copied' ? this.copiedLabel() : this.label()));
  protected readonly message = computed(() =>
    this.state() === 'copied' ? this.copiedLabel() : this.state() === 'failed' ? 'Copy failed' : '',
  );

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async copy(): Promise<void> {
    const ok = await writeClipboard(this.value());
    this.state.set(ok ? 'copied' : 'failed');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), 2000);
  }
}
