import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/remix';
import { LayoutDashboard, Shield, LogOut } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSeparator } from '~/components/ui/Dropdown';
import { ConfirmationDialog } from '~/components/ui/Dialog';
import { UserAvatar } from './UserAvatar';
import { useThemeStyles, getColors } from '~/components/editor/hooks';
import { en } from '~/lib/i18n/locales/en';

const MAIN_PLATFORM_URL =
  typeof window !== 'undefined' && window.location.hostname.includes('flowstarter.dev')
    ? 'https://flowstarter.dev'
    : 'http://localhost:3000';

export function EditorUserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isDark } = useThemeStyles();
  const colors = getColors(isDark);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.emailAddresses?.[0]?.emailAddress || '';
  const imageUrl = user?.imageUrl;

  const handleSignOut = () => {
    signOut();
    setShowSignOutDialog(false);
  };

  return (
    <>
      <Dropdown
        trigger={<UserAvatar />}
        align="end"
        sideOffset={8}
      >
        {/* Profile header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px 10px',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              background: imageUrl ? 'transparent' : colors.primaryGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              (firstName?.charAt(0) || 'U').toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#fff' : '#09090b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
            {email && (
              <div
                style={{
                  fontSize: '12px',
                  color: isDark ? 'rgba(255,255,255,0.5)' : '#71717a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {email}
              </div>
            )}
          </div>
        </div>

        <DropdownSeparator />

        <DropdownItem onSelect={() => window.open(`${MAIN_PLATFORM_URL}/team/dashboard`, '_blank')}>
          <LayoutDashboard size={16} style={{ opacity: 0.6 }} />
          {en.editor.userMenu.dashboard}
        </DropdownItem>

        <DropdownItem onSelect={() => window.open(`${MAIN_PLATFORM_URL}/team/dashboard/security`, '_blank')}>
          <Shield size={16} style={{ opacity: 0.6 }} />
          {en.editor.userMenu.security}
        </DropdownItem>

        <DropdownSeparator />

        <DropdownItem
          onSelect={() => setShowSignOutDialog(true)}
          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          <LogOut size={16} />
          {en.editor.userMenu.signOut}
        </DropdownItem>
      </Dropdown>

      <ConfirmationDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleSignOut}
        title={en.editor.userMenu.signOutTitle}
        description={en.editor.userMenu.signOutDescription}
        confirmLabel={en.editor.userMenu.signOut}
        variant="destructive"
      />
    </>
  );
}
