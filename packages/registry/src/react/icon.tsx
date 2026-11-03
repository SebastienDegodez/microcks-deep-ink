import type { Ref, SVGProps } from 'react';

/** Inline stroke icons: 24px grid, 2px stroke, currentColor. */
const PATHS = {
  // navigation and objects
  cockpit: ['M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v4h-6zM4 20h6v-4H4z'],
  apis: ['M4 6h16M4 12h16M4 18h10'],
  tests: ['M9 3h6M10 3v6L5 19a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-10V3'],
  sources: ['M6 3v12', 'M6 9a3 3 0 1 0 0-6', 'M18 21a3 3 0 1 0 0-6a3 3 0 1 0 0 6', 'M6 15c0 3 3 3 6 3h3'],
  usage: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
  traces: ['M3 12h4l3-8 4 16 3-8h4'],
  hub: ['M12 2l9 5v10l-9 5-9-5V7z', 'M12 22V12M21 7l-9 5-9-5'],
  admin: [
    'M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8',
    'M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  ],
  plugin: ['M9 3v4M15 3v4M7 7h10v5a5 5 0 0 1-10 0z', 'M12 17v4'],
  user: ['M12 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8', 'M4 21a8 8 0 0 1 16 0'],
  // status and feedback
  check: ['M5 12l5 5 9-10'],
  cross: ['M6 6l12 12M18 6L6 18'],
  dash: ['M6 12h12'],
  warning: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17v.5'],
  info: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16', 'M12 11v5', 'M12 8v.5'],
  running: ['M12 3a9 9 0 1 0 9 9'],
  circle: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16'],
  spark: ['M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'],
  // workflow
  retry: ['M20 11a8 8 0 1 0-2 6', 'M20 4v7h-7'],
  end: ['M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16', 'M9 9h6v6H9z'],
  branch: ['M6 3v18', 'M18 3v6a6 6 0 0 1-6 6H6'],
  play: ['M7 4l13 8-13 8z'],
  pause: ['M8 4v16M16 4v16'],
  undo: ['M9 14L4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-3'],
  // actions
  search: ['M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14', 'M20 20l-3.5-3.5'],
  copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6M14 11v6'],
  plus: ['M12 5v14M5 12h14'],
  close: ['M6 6l12 12M18 6L6 18'],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'],
  link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  'link-out': ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  // arrows and theme
  chevron: ['M9 6l6 6-6 6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'arrow-up': ['M12 19V5', 'M6 11l6-6 6 6'],
  'arrow-down': ['M12 5v14', 'M6 13l6 6 6-6'],
  sun: [
    'M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8',
    'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  ],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
} as const;

export type IconName = keyof typeof PATHS;

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'ref' | 'children'> {
  name: IconName;
  /** Width and height in px. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from assistive technology. */
  label?: string;
  ref?: Ref<SVGSVGElement>;
}

/**
 * Inline SVG icon. Decorative (`aria-hidden`) unless `label` is set, then `role="img"` with an `aria-label`.
 * Never use an icon alone to carry a status: pair it with a word.
 */
export function Icon({ name, size = 16, label, className, ref, ...rest }: IconProps) {
  const paths: readonly string[] = PATHS[name] ?? PATHS.circle;
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
      {...rest}
      className={['di-icon', className].filter(Boolean).join(' ')}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
