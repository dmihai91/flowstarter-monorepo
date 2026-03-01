import React from 'react';
import { useUser } from '@clerk/remix';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

interface UserAvatarProps {
  initial?: string;
  onClick?: () => void;
}

export function UserAvatar({ initial, onClick }: UserAvatarProps) {
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const { user } = useUser();

  const imageUrl = user?.imageUrl;
  const displayInitial =
    initial ||
    user?.firstName?.charAt(0) ||
    user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
    'U';

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
        background: imageUrl ? 'transparent' : colors.primaryGradient,
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        boxShadow: colors.primaryShadow,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="User avatar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      ) : (
        displayInitial.toUpperCase()
      )}
    </button>
  );
}
