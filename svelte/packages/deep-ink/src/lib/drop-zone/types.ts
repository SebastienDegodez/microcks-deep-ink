import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface DropZoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ondrop' | 'class' | 'children'> {
  class?: string;
  heading: string;
  /** Text under the heading. A node is allowed ("A <code>microcks-repository.json</code> exported from…"). */
  hint: string | number | Snippet;
  /** Passed to the native input as a picker hint. Validate files in your application. */
  accept?: string;
  multiple?: boolean;
  /** Visible label of the file picker button ("Browse"). */
  chooseLabel?: string;
  onfiles: (files: File[]) => void;
  /**
   * `md` (default): 44px padding, a 52px icon circle, a 19px heading and a primary Choose button.
   * `sm`: a compact zone in a panel (Admin snapshots): padding 28px 16px, radius 12, a dashed strong border,
   * a bare 28px upload icon, a 14px heading, a 12px hint and a 36px secondary Choose button.
   */
  size?: 'md' | 'sm';
  /** Extra actions next to the Choose button ("Use a sample snapshot"). */
  children?: string | number | Snippet;
}
