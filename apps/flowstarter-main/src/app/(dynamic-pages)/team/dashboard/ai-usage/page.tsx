'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  TeamDashboardShell,
  ShellCard,
} from '../components/TeamDashboardShell';

interface Project {
  id: string;
  name: string;
  status: string;
  ai_credits_used: number | null;
  generation_cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconBg: string;
}) {
  return (
    <ShellCard className="!p-5">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-white/40 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{sub}</p>
      )}
    </ShellCard>
  );
}

export default function AiUsagePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['team-projects-ai'],
    queryFn: async () => {
      const res = await fetch('/api/team/projects');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ projects: Project[] }>;
    },
  });

  const projects = (data?.projects ?? [])
    .filter(
      (p) => (p.ai_credits_used ?? 0) > 0 || (p.generation_cost_usd ?? 0) > 0
    )
    .sort(
      (a, b) => (b.generation_cost_usd ?? 0) - (a.generation_cost_usd ?? 0)
    );

  const totalCredits = projects.reduce(
    (s, p) => s + (p.ai_credits_used ?? 0),
    0
  );
  const totalCostUsd = projects.reduce(
    (s, p) => s + (p.generation_cost_usd ?? 0),
    0
  );
  const totalCostEur = totalCostUsd * 0.92;
  const avgPerProject = projects.length ? totalCostEur / projects.length : 0;

  return (
    <TeamDashboardShell
      title="AI Usage"
      subtitle="Credits and cost breakdown per project"
      icon={<Sparkles className="w-5 h-5 text-[var(--purple)]" />}
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <ShellCard key={i} className="!p-5 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] mb-3" />
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/[0.06] mb-2" />
              <div className="h-6 w-16 rounded bg-gray-100 dark:bg-white/[0.06]" />
            </ShellCard>
          ))
        ) : (
          <>
            <StatCard
              icon={<Zap className="w-5 h-5 text-[var(--purple)]" />}
              iconBg="bg-[var(--purple)]/10"
              label="Total credits used"
              value={totalCredits.toLocaleString()}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-500/10"
              label="Total cost"
              value={`€${totalCostEur.toFixed(2)}`}
              sub={`$${totalCostUsd.toFixed(2)} USD`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-500/10"
              label="Projects with AI"
              value={projects.length.toString()}
            />
            <StatCard
              icon={<Sparkles className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-500/10"
              label="Avg cost / project"
              value={`€${avgPerProject.toFixed(2)}`}
            />
          </>
        )}
      </div>

      {/* Per-project table */}
      <ShellCard className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Breakdown by project
          </h2>
        </div>

        {isLoading && (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="px-5 py-4 flex items-center gap-4 animate-pulse"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
                <div className="flex-1 h-4 rounded bg-gray-100 dark:bg-white/[0.06]" />
                <div className="w-20 h-4 rounded bg-gray-100 dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="px-5 py-16 text-center">
            <Sparkles className="w-8 h-8 text-gray-300 dark:text-white/20 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-white/30">
              No AI usage recorded yet
            </p>
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">
              <span>Project</span>
              <span className="text-right">Credits</span>
              <span className="text-right">Cost (USD)</span>
              <span className="text-right">Cost (EUR)</span>
              <span className="text-right">% of total</span>
            </div>

            {projects.map((p) => {
              const credits = p.ai_credits_used ?? 0;
              const costUsd = p.generation_cost_usd ?? 0;
              const costEur = costUsd * 0.92;
              const pct = totalCostEur > 0 ? (costEur / totalCostEur) * 100 : 0;
              const ago = p.updated_at
                ? formatDistanceToNow(new Date(p.updated_at), {
                    addSuffix: true,
                  })
                : '';
              return (
                <div
                  key={p.id}
                  className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="sm:hidden flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        {credits} credits · €{costEur.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--purple)] shrink-0">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="hidden sm:grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/30">
                        {ago}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white/70 text-right">
                      {credits.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white/70 text-right">
                      ${costUsd.toFixed(4)}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                      €{costEur.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-10 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--purple)]"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--purple)] font-medium w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 px-5 py-3 bg-gray-50/50 dark:bg-white/[0.02] items-center border-t border-gray-200 dark:border-white/[0.08]">
              <p className="text-xs font-bold text-gray-600 dark:text-white/50 uppercase tracking-wider">
                Total
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white text-right">
                {totalCredits.toLocaleString()}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white text-right">
                ${totalCostUsd.toFixed(4)}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white text-right">
                €{totalCostEur.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30 text-right">
                100%
              </p>
            </div>
          </div>
        )}
      </ShellCard>
    </TeamDashboardShell>
  );
}
