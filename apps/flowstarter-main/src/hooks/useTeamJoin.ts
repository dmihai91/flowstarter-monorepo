'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

export interface TeamJoinValidation {
  valid: boolean;
  email?: string;
  role?: string;
  error?: string;
}

const teamJoinKeys = {
  validate: (token: string) => ['team-join-validate', token] as const,
};

export function useTeamJoinValidation(token: string | null) {
  return useQuery({
    queryKey: teamJoinKeys.validate(token || ''),
    enabled: !!token,
    queryFn: async (): Promise<TeamJoinValidation> => {
      const res = await fetch('/api/team/join/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Invalid invitation');
      }
      return res.json();
    },
  });
}

export function useTeamJoin() {
  return useMutation({
    mutationFn: async (token: string): Promise<{ success: boolean }> => {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to join team');
      }
      return res.json();
    },
  });
}
