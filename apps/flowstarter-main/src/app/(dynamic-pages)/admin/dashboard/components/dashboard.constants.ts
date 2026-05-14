import { useQuery } from '@tanstack/react-query';
import type { TranslationKeys } from '@/lib/i18n';

// ─── Stage display (read-only — kanban owns the writes) ───────────────────

export const STAGE_I18N_KEYS: Partial<Record<string, TranslationKeys>> = {
  intake: 'admin.stage.intake',
  brief: 'admin.stage.brief',
  build: 'admin.stage.build',
  internal_review: 'admin.stage.build',
  client_review: 'admin.stage.review',
  launched: 'admin.stage.live',
  care: 'admin.stage.live',
};

export const STAGE_DOT: Record<string, string> = {
  intake: 'bg-slate-400 dark:bg-slate-500',
  brief: 'bg-sky-500',
  build: 'bg-amber-500',
  internal_review: 'bg-amber-500',
  client_review: 'bg-orange-500',
  launched: 'bg-emerald-500',
  care: 'bg-emerald-500',
};

export const TIER_I18N_KEYS: Partial<Record<string, TranslationKeys>> = {
  essential: 'admin.tier.essential',
  pro: 'admin.tier.pro',
  commerce: 'admin.tier.commerce',
  custom: 'admin.tier.custom',
};

// ─── Client types & data hook ─────────────────────────────────────────────

export interface Client {
  key: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  projectCount: number;
  totalFee: number;
  stages: string[];
  tiers: string[];
  deployStatuses: string[];
  lastActivity: string;
}

export function useTeamClients() {
  return useQuery({
    queryKey: ['team-clients'],
    queryFn: async (): Promise<Client[]> => {
      const res = await fetch('/api/admin/clients', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load clients');
      const json = (await res.json()) as { clients: Client[] };
      return json.clients ?? [];
    },
    staleTime: 20_000,
    retry: 1,
  });
}
