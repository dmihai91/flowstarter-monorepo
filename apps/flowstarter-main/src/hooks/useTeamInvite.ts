'use client';

import { useMutation } from '@tanstack/react-query';

export interface TeamInviteData {
  email: string;
  role?: string;
}

export function useTeamInvite() {
  return useMutation({
    mutationFn: async (data: TeamInviteData): Promise<{ success: boolean; inviteUrl?: string }> => {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send invitation');
      }
      return res.json();
    },
  });
}
