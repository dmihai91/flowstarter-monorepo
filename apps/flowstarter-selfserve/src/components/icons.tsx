// Inline icon set ported from the prototype's components.jsx (currentColor strokes).
import React from 'react';

type IconProps = {
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
};

const I = ({
  d,
  size = 18,
  stroke = 1.8,
  fill = 'none',
  style,
  className,
}: IconProps & { d: React.ReactNode; fill?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    {d}
  </svg>
);

export const Icons = {
  arrow: (p: IconProps) => <I {...p} d={<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>} />,
  check: (p: IconProps) => <I {...p} d={<path d="M4 12l5 5L20 6" />} />,
  spark: (p: IconProps) => <I {...p} d={<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />} />,
  search: (p: IconProps) => <I {...p} d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>} />,
  pen: (p: IconProps) => <I {...p} d={<path d="M16 4l4 4L8 20l-4 1 1-4z" />} />,
  brush: (p: IconProps) => <I {...p} d={<><path d="M9.5 14.5L18 6a2 2 0 0 1 3 3l-8.5 8.5" /><path d="M9.5 14.5c-1.5-.5-3 .5-3.5 2S4 21 4 21s2-1.5 3.5-2 1.5-3 0-4.5z" /></>} />,
  code: (p: IconProps) => <I {...p} d={<><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /></>} />,
  rocket: (p: IconProps) => <I {...p} d={<><path d="M12 3c3 1 6 4 6 9l-3 3H9l-3-3c0-5 3-8 6-9z" /><circle cx="12" cy="9" r="1.6" /><path d="M9 15l-2 4M15 15l2 4" /></>} />,
  globe: (p: IconProps) => <I {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></>} />,
  bolt: (p: IconProps) => <I {...p} d={<path d="M13 2L4 14h7l-1 8 9-12h-7z" />} />,
  chart: (p: IconProps) => <I {...p} d={<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />} />,
  cal: (p: IconProps) => <I {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>} />,
  user: (p: IconProps) => <I {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />,
  warn: (p: IconProps) => <I {...p} d={<><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></>} />,
  star: (p: IconProps) => <I {...p} d={<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z" />} />,
  flow: (p: IconProps) => <I {...p} d={<path d="M3 16c3 0 3-8 6-8s3 8 6 8 3-8 6-8" />} />,
  shield: (p: IconProps) => <I {...p} d={<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>} />,
  card: (p: IconProps) => <I {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>} />,
  moon: (p: IconProps) => <I {...p} d={<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />} />,
  sun: (p: IconProps) => <I {...p} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>} />,
  auto: (p: IconProps) => <I {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" /></>} />,
  box: (p: IconProps) => <I {...p} d={<><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></>} />,
  plus: (p: IconProps) => <I {...p} d={<path d="M12 5v14M5 12h14" />} />,
  file: (p: IconProps) => <I {...p} d={<><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v4h4" /></>} />,
  wand: (p: IconProps) => <I {...p} d={<><path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18 3l-1.5 1.5M18 9l-1.5-1.5" /><path d="M13 8L4 17l3 3 9-9" /></>} />,
  bot: (p: IconProps) => <I {...p} d={<><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 8V4M9 4h6" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /></>} />,
  logout: (p: IconProps) => <I {...p} d={<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5M15 12H3" /></>} />,
  eye: (p: IconProps) => <I {...p} d={<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>} />,
  clock: (p: IconProps) => <I {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  close: (p: IconProps) => <I {...p} d={<path d="M6 6l12 12M18 6L6 18" />} />,
  lock: (p: IconProps) => <I {...p} d={<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />,
  download: (p: IconProps) => <I {...p} d={<><path d="M12 3v12" /><path d="M6 11l6 6 6-6" /><path d="M4 21h16" /></>} />,
  mail: (p: IconProps) => <I {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} />,
  refresh: (p: IconProps) => <I {...p} d={<><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></>} />,
};

export const ROLE_ICON: Record<string, (p: IconProps) => React.JSX.Element> = {
  research: Icons.search,
  brand: Icons.brush,
  copy: Icons.pen,
  dev: Icons.code,
};
