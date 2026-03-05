import React from 'react';

export const ReactIcon = ({ size = 16, color = '#61dafb' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" fill="none" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);

export const TypeScriptIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#3178c6" />
    <path d="M14.5 17.5V13h-1.5v4.5h1.5zm.5-6.5c0-1.38-1.12-2.5-2.5-2.5h-3v7h1.5v-2h1.5c1.38 0 2.5-1.12 2.5-2.5zm-2.5 1h-1.5v-2h1.5c.55 0 1 .45 1 1s-.45 1-1 1z" fill="none" />
    <text x="6" y="17" fontSize="9" fontWeight="bold" fill="white" fontFamily="Arial">TS</text>
  </svg>
);

export const JavaScriptIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#f7df1e" />
    <text x="6" y="17" fontSize="9" fontWeight="bold" fill="#000" fontFamily="Arial">JS</text>
  </svg>
);

export const CSSIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#264de4" />
    <text x="4" y="17" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">CSS</text>
  </svg>
);

export const JSONIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#5a5a5a" />
    <text x="3" y="16" fontSize="7" fontWeight="bold" fill="#f5de19" fontFamily="monospace">{'{}'}</text>
  </svg>
);

export const MarkdownIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#083fa1" />
    <text x="4" y="16" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">MD</text>
  </svg>
);

export const HTMLIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="2" fill="#e34c26" />
    <text x="3" y="16" fontSize="6" fontWeight="bold" fill="white" fontFamily="Arial">HTML</text>
  </svg>
);

export const FileIcon = ({ size = 16, color = '#888' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/** Returns the appropriate icon component for a file based on its extension. */
export function getFileIconComponent(path: string, isDark: boolean): React.ReactElement {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const size = 16;

  switch (ext) {
    case 'tsx':
    case 'jsx':
      return <ReactIcon size={size} color={isDark ? '#61dafb' : '#087ea4'} />;
    case 'ts':
      return <TypeScriptIcon size={size} />;
    case 'js':
      return <JavaScriptIcon size={size} />;
    case 'css':
    case 'scss':
      return <CSSIcon size={size} />;
    case 'json':
      return <JSONIcon size={size} />;
    case 'md':
      return <MarkdownIcon size={size} />;
    case 'html':
      return <HTMLIcon size={size} />;
    default:
      return <FileIcon size={size} color={isDark ? '#888' : '#666'} />;
  }
}
