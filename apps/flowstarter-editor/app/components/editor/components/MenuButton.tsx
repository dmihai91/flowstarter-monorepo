import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface MenuButtonProps {
  onClick?: () => void;
}

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function MenuButton({ onClick }: MenuButtonProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <button
      onClick={onClick}
      style={{
        width: '36px',
        height: '36px',
        flexShrink: 0,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: colors.borderMedium,
        cursor: 'pointer',
        color: colors.textMuted,
      }}
    >
      <MenuIcon />
    </button>
  );
}
