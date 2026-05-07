'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Plus,
  Search,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TeamDashboardShell } from '../components/TeamDashboardShell';
import { useTeamProjects } from '@/hooks/useTeamProjects';

const STAGE_LABEL: Record<string, string> = {
  intake: 'Intake',
  brief: 'Brief',
  build: 'Building',
  internal_review: 'Internal review',
  client_review: 'Client review',
  launched: 'Launched',
  care: 'Care',
};

const STAGE_TONE: Record<string, string> = {
  intake:
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  brief: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  build:
    'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  internal_review:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  client_review:
    'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  launched:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  care: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
};

const TIER_LABEL: Record<string, string> = {
  essential: 'Essential',
  pro: 'Pro',
  commerce: 'Commerce',
  custom: 'Custom',
};

const TIER_TONE: Record<string, string> = {
  essential:
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  commerce:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  custom:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};

export default function TeamProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading, error } = useTeamProjects();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const all = projects ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) => {
      const haystack = [
        p.name,
        p.slug,
        p.client_name,
        p.client_business_name,
        p.client_email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, search]);

  return (
    <TeamDashboardShell
      title={`Projects · ${projects?.length ?? 0}`}
      subtitle="All concierge projects across all clients"
      icon={<FolderOpen className="w-5 h-5" />}
      actions={
        <button
          onClick={() => router.push('/team/dashboard/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
        >
          <Plus className="w-4 h-4" /> New project
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fs-ink-faint)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, client, slug…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-white/5 dark:border-white/15 border-gray-300/90 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--purple)]/30"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border animate-pulse"
              style={{
                background: 'var(--fs-glass-bg)',
                borderColor: 'var(--fs-glass-edge)',
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">Failed to load projects.</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div
          className="rounded-[var(--fs-radius-2xl)] border p-12 text-center"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <FolderOpen className="mx-auto mb-3 h-8 w-8 text-[var(--fs-ink-faint)]" />
          <p className="text-sm text-[var(--fs-ink-faint)]">
            {search ? 'No projects match your search.' : 'No projects yet.'}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div
          className="rounded-[var(--fs-radius-2xl)] border overflow-hidden"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--fs-rule)] text-left">
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Project
                </th>
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Client
                </th>
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Stage
                </th>
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Tier
                </th>
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Commerce
                </th>
                <th className="px-4 py-3 font-medium text-[var(--fs-ink-faint)]">
                  Updated
                </th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stage = (p.concierge_stage as string) || 'intake';
                const tier = (p.tier_name as string) || '';
                const hasCommerce =
                  (p.commerce_mode as string) &&
                  (p.commerce_mode as string) !== 'none';
                const updatedAt = p.updated_at || p.created_at;
                return (
                  <tr
                    key={p.id}
                    onClick={() =>
                      router.push(`/team/dashboard/projects/${p.id}`)
                    }
                    className="border-b border-[var(--fs-rule)] last:border-0 hover:bg-white/40 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--fs-ink)] truncate max-w-[20rem]">
                        {p.name || 'Untitled'}
                      </div>
                      {p.slug && (
                        <div className="text-[0.65rem] text-[var(--fs-ink-faint)] truncate">
                          {p.slug}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[var(--fs-ink-dim)] truncate max-w-[16rem]">
                        {p.client_business_name || p.client_name || '—'}
                      </div>
                      <div className="text-[0.65rem] text-[var(--fs-ink-faint)] truncate">
                        {p.client_email ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                          STAGE_TONE[stage] ?? STAGE_TONE.intake
                        }`}
                      >
                        {STAGE_LABEL[stage] ?? stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tier ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                            TIER_TONE[tier] ?? ''
                          }`}
                        >
                          {TIER_LABEL[tier] ?? tier}
                        </span>
                      ) : (
                        <span className="text-[var(--fs-ink-faint)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasCommerce ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--fs-ink-dim)]">
                          <ShoppingBag className="w-3 h-3" />
                          {(p.commerce_provider as string) || 'custom'}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--fs-ink-faint)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.7rem] text-[var(--fs-ink-faint)]">
                      {updatedAt
                        ? formatDistanceToNow(new Date(updatedAt), {
                            addSuffix: true,
                          })
                        : '—'}
                    </td>
                    <td className="px-2 text-[var(--fs-ink-faint)]">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </TeamDashboardShell>
  );
}
