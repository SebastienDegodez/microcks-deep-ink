export interface CodeLine {
  text: string;
  /** Marks the line with a visible cross (11px icon) and a hidden "Problem: " prefix; add a `note`. */
  bad?: boolean;
  /** Inline note written after the text, on the same row ("schema: number"). */
  note?: string;
  /** Highlights the line (selected block). */
  selected?: boolean;
  /** Marks a changed line of a diff: a visible "+" in a mark column, the selected fill and a hidden "Changed: " prefix. */
  changed?: boolean;
}

export interface CodeTab {
  id: string;
  label: string;
}
