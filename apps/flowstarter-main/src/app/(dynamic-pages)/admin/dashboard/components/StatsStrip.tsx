import type { ReactNode } from 'react';
import {
  FolderKanban,
  Globe,
  Users,
  Wallet,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { formatTokenCount, formatEuro } from '@/lib/format-utils';
import type { useTeamDashboardStats } from '@/hooks/useTeamDashboardStats';

// ─── Tone palettes per stat cell ────────────────────────────────────────────

const STAT_CELL_TONES = [
  {
    toneClass: 'ls-stat-tone-workspaces',
    iconShell:
      'border-indigo-200/80 bg-indigo-50/95 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-indigo-300/18 dark:bg-indigo-500/30 dark:text-indigo-100 dark:shadow-none',
    labelDot: 'bg-indigo-400 dark:bg-indigo-300',
  },
  {
    toneClass: 'ls-stat-tone-live',
    iconShell:
      'border-emerald-200/80 bg-emerald-50/95 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-emerald-300/18 dark:bg-emerald-500/28 dark:text-emerald-100 dark:shadow-none',
    labelDot: 'bg-emerald-400 dark:bg-emerald-300',
  },
  {
    toneClass: 'ls-stat-tone-clients',
    iconShell:
      'border-teal-200/80 bg-teal-50/95 text-teal-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-teal-300/18 dark:bg-teal-500/28 dark:text-teal-100 dark:shadow-none',
    labelDot: 'bg-teal-400 dark:bg-teal-300',
  },
  {
    toneClass: 'ls-stat-tone-revenue',
    iconShell:
      'border-violet-200/80 bg-violet-50/95 text-violet-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-violet-300/18 dark:bg-violet-500/28 dark:text-violet-100 dark:shadow-none',
    labelDot: 'bg-violet-400 dark:bg-violet-300',
  },
  {
    toneClass: 'ls-stat-tone-ai',
    iconShell:
      'border-sky-200/80 bg-sky-50/95 text-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-sky-300/18 dark:bg-sky-500/28 dark:text-sky-100 dark:shadow-none',
    labelDot: 'bg-sky-400 dark:bg-sky-300',
  },
] as const;

// ─── Types ──────────────────────────────────────────────────────────────────

type StatCellProps = {
  label: string;
  value: string | null;
  sub: ReactNode;
  live?: boolean;
  icon: LucideIcon;
  /** Per-cell loading toggle so cells driven by different queries can show
   * skeletons independently of the shared stats query. */
  loadingOverride?: boolean;
};

// ─── StatsStrip ─────────────────────────────────────────────────────────────

export function StatsStrip({
  stats,
  loading,
  error,
  clientCount,
  clientsLoading,
}: {
  stats: ReturnType<typeof useTeamDashboardStats>['data'];
  loading: boolean;
  error: boolean;
  clientCount: number | null;
  clientsLoading: boolean;
}) {
  const { t } = useTranslations();

  const aiSub =
    stats == null
      ? '—'
      : stats.aiSessionsThisMonth === 0
      ? t('admin.dashboard.stats.aiThisMonthSubEmpty')
      : stats.aiSessionsThisMonth === 1
      ? t('admin.dashboard.stats.aiThisMonthSub', {
          tokens: stats.aiTokensThisMonth.toLocaleString('en-IE'),
        })
      : t('admin.dashboard.stats.aiThisMonthSubPlural', {
          tokens: stats.aiTokensThisMonth.toLocaleString('en-IE'),
          count: stats.aiSessionsThisMonth,
        });

  const revenueSub: ReactNode = stats ? (
    <div className="flex flex-col gap-2.5">
      <span className="block text-[var(--ls-ink-dim)]">
        {t('admin.dashboard.stats.revenueSubArr', {
          arr: formatEuro(stats.monthlyRevenue * 12),
        })}
      </span>
      <div className="flex flex-col gap-1 text-[var(--ls-ink-faint)]">
        <span className="block">
          {t('admin.dashboard.stats.revenueSubSetupOnly', {
            setup: formatEuro(stats.totalSetupFees),
          })}
        </span>
        <span className="block">
          {stats.paidCount === 1
            ? t('admin.dashboard.stats.revenueSubInvoicesSingular', {
                count: stats.paidCount,
              })
            : t('admin.dashboard.stats.revenueSubInvoicesPlural', {
                count: stats.paidCount,
              })}
        </span>
      </div>
    </div>
  ) : (
    '—'
  );

  const clientsSub: ReactNode = clientsLoading
    ? '—'
    : clientCount === null
    ? '—'
    : clientCount === 0
    ? t('admin.dashboard.stats.clientsSubEmpty')
    : clientCount === 1
    ? t('admin.dashboard.stats.clientsSub', { count: clientCount })
    : t('admin.dashboard.stats.clientsSubPlural', { count: clientCount });

  const cells: StatCellProps[] = [
    {
      label: t('admin.dashboard.stats.projects'),
      value: stats ? String(stats.totalProjects) : null,
      sub: stats
        ? t('admin.dashboard.stats.projectsSub', {
            draft: stats.draftCount,
            building: stats.inProgressCount,
          })
        : '—',
      icon: FolderKanban,
      loadingOverride: loading,
    },
    {
      label: t('admin.dashboard.stats.live'),
      value: stats ? String(stats.liveCount) : null,
      sub: stats?.liveCount
        ? t('admin.dashboard.stats.liveSubOn')
        : t('admin.dashboard.stats.liveSubOff'),
      live: !!stats && stats.liveCount > 0,
      icon: Globe,
      loadingOverride: loading,
    },
    {
      label: t('admin.dashboard.stats.clients'),
      value:
        clientsLoading || clientCount === null ? null : String(clientCount),
      sub: clientsSub,
      icon: Users,
      loadingOverride: loading || clientsLoading,
    },
    {
      label: t('admin.dashboard.stats.revenue'),
      value: stats ? formatEuro(stats.monthlyRevenue) : null,
      sub: revenueSub,
      icon: Wallet,
      loadingOverride: loading,
    },
    {
      label: t('admin.dashboard.stats.aiThisMonth'),
      value: stats ? formatTokenCount(stats.aiTokensThisMonth) : null,
      sub: aiSub,
      icon: Sparkles,
      loadingOverride: loading,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 lg:gap-4">
      {cells.map(({ loadingOverride, ...rest }, i) => (
        <StatCell
          key={`${rest.label}-${i}`}
          {...rest}
          loading={loadingOverride ?? loading}
          error={error}
          toneIndex={i}
        />
      ))}
    </section>
  );
}

// ─── StatCell ───────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  sub,
  live,
  icon: Icon,
  loading,
  error,
  toneIndex,
}: StatCellProps & {
  loading: boolean;
  error: boolean;
  toneIndex: number;
}) {
  const tone = STAT_CELL_TONES[toneIndex % STAT_CELL_TONES.length]!;

  return (
    <div
      className={[
        'ls-stat-cell relative flex min-h-[128px] flex-col gap-2 overflow-hidden rounded-xl border border-[var(--ls-rule)] px-5 py-5 sm:min-h-[132px] lg:min-h-[136px] lg:py-6',
        tone.toneClass,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={[
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border',
            tone.iconShell,
          ].join(' ')}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="ls-admin-label inline-flex min-w-0 flex-1 items-center gap-2">
          {live ? (
            <PulseDot />
          ) : (
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone.labelDot}`}
            />
          )}
          <span className="truncate">{label}</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div
          className="text-[2rem] font-medium leading-[1.12] tracking-[-0.02em] text-[var(--ls-ink)]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {loading ? (
            <span className="inline-block h-8 w-20 animate-pulse rounded bg-[var(--ls-rule)] align-middle" />
          ) : error || value === null ? (
            <span className="text-[var(--ls-ink-faint)]">—</span>
          ) : (
            value
          )}
        </div>
        <div
          className="min-h-[2.625rem] font-mono text-[13px] tabular-nums leading-snug text-[var(--ls-ink-dim)] sm:min-h-[2.75rem]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {loading ? '\u00a0' : sub}
        </div>
      </div>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
      <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </span>
  );
}
