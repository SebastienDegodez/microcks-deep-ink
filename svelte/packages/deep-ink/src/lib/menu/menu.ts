export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  /** Renders an `<a>` for navigation instead of a `<button>`. */
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  /** Draws a separator line before this item (before "Delete"). */
  separatorBefore?: boolean;
  /** One line under the item, linked with aria-describedby. */
  description?: string;
}
