import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import type { IconName } from './internal/icon-data.js';

export type { IconName };
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'dashed' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'compact' | 'tile' | 'md' | 'lg';
export type ButtonTone = 'danger' | 'link';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  /** Heights: xs 28, sm 32, compact 34, tile 36, md 40, lg 44px. */
  size?: ButtonSize;
  /** danger for ghost/link; link for outline. */
  tone?: ButtonTone;
  /** Filled danger only inside a confirmation dialog. */
  confirm?: boolean;
  /** Shared registry icon name; decorative inside the control. */
  icon?: IconName;
  /** Requires aria-label, aria-labelledby or title. */
  iconOnly?: boolean;
  /** Busy indicator; prevents activation. */
  loading?: boolean;
  children?: Snippet;
}

export type ButtonProps = ButtonOwnProps & Omit<HTMLButtonAttributes, keyof ButtonOwnProps> & {
  /** Native DOM reference via bind:element. */
  element?: HTMLButtonElement;
};
export type ButtonLinkProps = ButtonOwnProps & Omit<HTMLAnchorAttributes, keyof ButtonOwnProps> & {
  /** Removes href and keyboard tab stop and prevents activation. */
  disabled?: boolean;
  element?: HTMLAnchorElement;
};

type SpanAttributes = Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;
type DivAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

export interface MethodTagProps extends SpanAttributes {
  method: string;
  protocol?: Protocol;
  /** Nonzero pixel override; zero/omitted retains host/default width. */
  minWidth?: number;
  size?: 'md' | 'sm' | 'xs';
}

export interface StatusBadgeProps extends SpanAttributes {
  status: Outcome;
  /** Blank labels fall back to the outcome word. */
  label?: string | Snippet;
  size?: 'md' | 'sm' | 'lg';
  shape?: 'circled' | 'bare';
  /** Supplement the mandatory visible word with formatted context. */
  children?: Snippet;
}

export interface LiveIndicatorProps extends SpanAttributes {
  label?: string;
  paused?: boolean;
  /** Include the word "paused" when providing custom paused text. */
  pausedLabel?: string;
  size?: 'md' | 'sm' | 'compact' | 'lg';
  variant?: 'pill' | 'inline' | 'box' | 'dot';
  pulse?: boolean;
}

export interface SummaryStripPart {
  text: string | Snippet;
  kind?: 'value' | 'label';
  sep?: boolean;
}

export interface SummaryStripProps extends DivAttributes {
  parts?: readonly SummaryStripPart[];
  gap?: 'normal' | 'roomy';
  values?: 'secondary' | 'text';
  variant?: 'default' | 'canvas';
  lineHeight?: 'fixed' | 'inherit';
  children?: Snippet;
}

export type SummaryStripSepProps = Omit<SpanAttributes, 'aria-hidden'>;
