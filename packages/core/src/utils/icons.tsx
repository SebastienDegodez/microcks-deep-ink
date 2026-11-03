import { h } from '@stencil/core';

/** Inline stroke icons for the elements: 24px grid, 2px stroke, currentColor, always aria-hidden. */
const PATHS: Record<string, string[]> = {
  check: ['M5 12l5 5 9-10'],
  cross: ['M6 6l12 12M18 6L6 18'],
  dash: ['M6 12h12'],
  circle: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16'],
  retry: ['M20 11a8 8 0 1 0-2 6', 'M20 4v7h-7'],
  end: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16', 'M9 9h6v6H9z'],
  search: ['M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14', 'M20 20l-3.5-3.5'],
  close: ['M6 6l12 12M18 6L6 18'],
  table: ['M4 5h16v14H4z', 'M4 10h16M10 5v14'],
  branch: ['M6 3v18', 'M18 3v6a6 6 0 0 1-6 6H6'],
};

export function icon(name: string, size = 16, strokeWidth = 2) {
  const paths = PATHS[name] ?? PATHS.circle ?? [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path d={d} />
      ))}
    </svg>
  );
}
