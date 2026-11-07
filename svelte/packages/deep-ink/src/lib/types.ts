import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

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
  label?: string;
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
