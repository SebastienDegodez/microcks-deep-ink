import { h } from '@stencil/core';

/** Inline stroke icons: 2px stroke, currentColor, aria-hidden. */
const PATHS: Record<string, string[]> = {
  check: ['M5 12l5 5 9-10'],
  cross: ['M6 6l12 12M18 6L6 18'],
  warning: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17v.5'],
  running: ['M12 3a9 9 0 1 0 9 9'],
  circle: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16'],
  spark: ['M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'],
  search: ['M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14', 'M20 20l-3.5-3.5'],
  copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  sun: ['M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8', 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  cockpit: ['M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v4h-6zM4 20h6v-4H4z'],
  apis: ['M4 6h16M4 12h16M4 18h10'],
  tests: ['M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-10V3'],
  sources: ['M6 3v12', 'M6 9a3 3 0 1 0 0-6', 'M18 21a3 3 0 1 0 0-6a3 3 0 1 0 0 6', 'M6 15c0 3 3 3 6 3h3'],
  usage: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
  traces: ['M3 12h4l3-8 4 16 3-8h4'],
  hub: ['M12 2l9 5v10l-9 5-9-5V7z', 'M12 22V12M21 7l-9 5-9-5'],
  admin: ['M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8', 'M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'],
  plugin: ['M9 3v4M15 3v4M7 7h10v5a5 5 0 0 1-10 0z', 'M12 17v4'],
  chevron: ['M9 6l6 6-6 6'],
  user: ['M12 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8', 'M4 21a8 8 0 0 1 16 0'],
};

export function icon(name: string, size = 16, strokeWidth = 2) {
  const paths = PATHS[name] ?? PATHS.circle;
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
      part="icon"
    >
      {paths.map((d) => (
        <path d={d} />
      ))}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
