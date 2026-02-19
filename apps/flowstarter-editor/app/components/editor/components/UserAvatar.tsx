import React from 'react';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface UserAvatarProps {
  initial?: string;
  onClick?: () => void;
}

export function UserAvatar({ initial = 'U', onClick }: UserAvatarProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);

  return (
    <button
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 700,
        background: colors.primaryGradient,
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: colors.primaryShadow,
      }}
    >
      {initial}
    </button>
  );
}
