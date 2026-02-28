/**
 * Role-based access control for the editor.
 * Determines what features are available based on Clerk user role.
 */

import { useUser } from '@clerk/remix';
import { useMemo } from 'react';

export type EditorRole = 'team' | 'client';

export interface EditorPermissions {
  role: EditorRole;
  canViewCode: boolean;
  canPublish: boolean;
  canEditSettings: boolean;
  canTogglePreviewCode: boolean;
}

export function useEditorRole(): EditorPermissions {
  const { user } = useUser();

  return useMemo(() => {
    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const role: EditorRole =
      metadata?.role === 'admin' || metadata?.role === 'team' ? 'team' : 'client';

    return {
      role,
      canViewCode: role === 'team',
      canPublish: role === 'team',
      canEditSettings: role === 'team',
      canTogglePreviewCode: role === 'team',
    };
  }, [user]);
}
