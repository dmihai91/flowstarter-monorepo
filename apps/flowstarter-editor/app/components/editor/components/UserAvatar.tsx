import React, { forwardRef } from 'react';
import { useUser } from '@clerk/remix';
import { useThemeStyles, getColors } from '~/components/editor/hooks';

export const UserAvatar = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => {
    const { isDark } = useThemeStyles();
    const colors = getColors(isDark);
    const { user } = useUser();

    const imageUrl = user?.imageUrl;
    const displayInitial =
      user?.firstName?.charAt(0) ||
      user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ||
      'U';

    return (
      <button
        ref={ref}
        {...props}
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
          flexShrink: 0,
          ...props.style,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          displayInitial.toUpperCase()
        )}
      </button>
    );
  }
);

UserAvatar.displayName = 'UserAvatar';
