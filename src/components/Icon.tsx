/** Icônes au trait, dessinées pour ce projet (aucune dépendance externe). */

const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z',
  file: 'M14 3H6.5v18h11V6.5zM14 3v3.5h3.5M9 12h6M9 15.5h6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  download: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14',
  upload: 'M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14',
  copy: 'M9 9h10.5v10.5H9zM15 9V4.5H4.5V15H9',
  mail: 'M3.5 6h17v12h-17zM4 6.5l8 6.5 8-6.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5v.5',
  alert: 'M12 3.5l9.5 16.5h-19zM12 10v4.5M12 17.5v.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
  external: 'M14 4.5h5.5V10M19.5 4.5L11 13M17 14v5.5H4.5V7H10',
  arrow: 'M5 12h14M13.5 6.5L19 12l-5.5 5.5',
  plus: 'M12 5v14M5 12h14',
  printer: 'M7 9V3.5h10V9M7 17H4.5V9h15v8H17M7 14h10v6.5H7z',
  eyeOff:
    'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-2.7 3.4M6.6 6.6C4.3 8.1 3 12 3 12s3.5 6 9 6c1.6 0 3-.5 4.3-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2',
  code: 'M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5',
  search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM15.5 15.5L20.5 20.5',
  send: 'M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z',
  bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5h4',
  database:
    'M4.5 6c0-1.4 3.4-2.5 7.5-2.5s7.5 1.1 7.5 2.5-3.4 2.5-7.5 2.5S4.5 7.4 4.5 6zM4.5 6v12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V6M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5',
  scissors: 'M6.5 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6.5 20.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.8 8.3L20 18M8.8 15.7L20 6',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
