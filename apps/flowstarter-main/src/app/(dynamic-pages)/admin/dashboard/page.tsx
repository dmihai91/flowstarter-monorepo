'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  FolderKanban,
  Globe,
  Wallet,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations, type TranslationKeys } from '@/lib/i18n';
import {
  useTeamProjects,
  useTeamRenameProject,
  useTeamDeleteProject,
} from '@/hooks/useTeamProjects';
import { useTeamDashboardStats } from '@/hooks/useTeamDashboardStats';
import { KanbanBoard } from './components/KanbanBoard';

export const dynamic = 'force-dynamic';

// ─── Stage display (read-only — kanban owns the writes) ───────────────────

const STAGE_I18N_KEYS: Partial<Record<string, TranslationKeys>> = {
  intake: 'admin.stage.intake',
  brief: 'admin.stage.brief',
  build: 'admin.stage.build',
  internal_review: 'admin.stage.build',
  client_review: 'admin.stage.review',
  launched: 'admin.stage.live',
  care: 'admin.stage.live',
};

const STAGE_DOT: Record<string, string> = {
  intake: 'bg-slate-400 dark:bg-slate-500',
  brief: 'bg-sky-500',
  build: 'bg-amber-500',
  internal_review: 'bg-amber-500',
  client_review: 'bg-orange-500',
  launched: 'bg-emerald-500',
  care: 'bg-emerald-500',
};

const TIER_I18N_KEYS: Partial<Record<string, TranslationKeys>> = {
  essential: 'admin.tier.essential',
  pro: 'admin.tier.pro',
  commerce: 'admin.tier.commerce',
  custom: 'admin.tier.custom',
};

// ─── Formatters ─────────────────────────────────────────────────────────────

const euro = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const tokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`;
  return n.toLocaleString('en-IE');
};

const compactRelative = (iso: string): string =>
  formatDistanceToNow(new Date(iso), { addSuffix: false })
    .replace('about ', '')
    .replace('almost ', '')
    .replace('over ', '')
    .replace('less than a minute', '<1m')
    .replace(/ minutes?/, 'm')
    .replace(/ hours?/, 'h')
    .replace(/ days?/, 'd')
    .replace(/ months?/, 'mo')
    .replace(/ years?/, 'y');

// ─── Clients data ───────────────────────────────────────────────────────────

interface Client {
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

function useTeamClients() {
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TeamDashboardPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { t } = useTranslations();
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects();
  const { data: clients, isLoading: clientsLoading } = useTeamClients();
  const { data: stats, isLoading: statsLoading, isError: statsError } =
    useTeamDashboardStats();

  if (!userLoaded) return <DashboardChrome>{null}</DashboardChrome>;
  if (!user) {
    router.push('/login');
    return null;
  }

  const firstName = user.firstName || 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('dashboard.greeting.morning')
      : hour < 18
      ? t('dashboard.greeting.afternoon')
      : hour < 21
      ? t('dashboard.greeting.evening')
      : t('dashboard.greeting.night');

  const recentProjects = (projects ?? []).slice(0, 8);

  return (
    <DashboardChrome>
      <Masthead
        greeting={greeting}
        firstName={firstName}
        projectCount={stats?.totalProjects ?? 0}
        loading={statsLoading || projectsLoading}
      />

      <StatsStrip stats={stats} loading={statsLoading} error={statsError} />

      <Panel
        eyebrow={t('admin.dashboard.pipeline.eyebrow')}
        title={t('admin.dashboard.pipeline.title')}
        meta={
          stats?.totalProjects
            ? stats.totalProjects === 1
              ? t('admin.dashboard.pipeline.metaWithCount', {
                  count: stats.totalProjects,
                })
              : t('admin.dashboard.pipeline.metaWithCountPlural', {
                  count: stats.totalProjects,
                })
            : t('admin.dashboard.pipeline.metaEmpty')
        }
        className="mt-7"
      >
        <KanbanBoard />
      </Panel>

      <Panel
        eyebrow={t('admin.dashboard.recent.eyebrow')}
        title={t('admin.dashboard.recent.title')}
        meta={
          projects?.length
            ? t('admin.dashboard.recent.metaTotal', { count: projects.length })
            : undefined
        }
        action={
          <Link
            href="/admin/dashboard/projects"
            className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--ls-ink-dim)] hover:text-[var(--ls-ink)]"
          >
            {t('admin.dashboard.viewAll')}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
        className="mt-7"
        flush
      >
        <ProjectsTable
          rows={recentProjects}
          loading={projectsLoading}
          onOpen={(id) => router.push(`/admin/dashboard/projects/${id}`)}
        />
      </Panel>

      <Panel
        eyebrow={t('admin.dashboard.accounts.eyebrow')}
        title={t('admin.dashboard.accounts.title')}
        meta={
          clients?.length
            ? t('admin.dashboard.accounts.meta', { count: clients.length })
            : undefined
        }
        action={
          <Link
            href="/admin/dashboard/clients"
            className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--ls-ink-dim)] hover:text-[var(--ls-ink)]"
          >
            {t('admin.dashboard.viewAll')}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
        className="mt-7"
        flush
      >
        <ClientsTable rows={clients ?? []} loading={clientsLoading} />
      </Panel>
    </DashboardChrome>
  );
}

// ─── Chrome ─────────────────────────────────────────────────────────────────

function DashboardChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="ls-scope px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">{children}</div>
    </div>
  );
}

// ─── Masthead ───────────────────────────────────────────────────────────────

function Masthead({
  greeting,
  firstName,
  projectCount,
  loading,
}: {
  greeting: string;
  firstName: string;
  projectCount: number;
  loading: boolean;
}) {
  const { t } = useTranslations();
  const inFlightBody =
    projectCount === 1
      ? t('admin.dashboard.masthead.workspacesInFlight', { count: projectCount })
      : t('admin.dashboard.masthead.workspacesInFlightPlural', {
          count: projectCount,
        });

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[640px]">
        <h1 className="ls-display ls-display--sm">
          Good {timeOfDayWord(greeting)},{' '}
          <span className="flourish">{firstName}.</span>
        </h1>
        <p className="ls-body mt-3 max-w-md">
          {loading
            ? t('admin.dashboard.masthead.loading')
            : projectCount === 0
              ? t('admin.dashboard.masthead.noWorkspaces')
              : inFlightBody}
        </p>
      </div>
      <Link
        href="/admin/dashboard/new"
        className="ls-cta ls-cta--sm self-start sm:self-auto"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('admin.dashboard.cta.newWorkspace')}
      </Link>
    </header>
  );
}

function timeOfDayWord(greeting: string): string {
  const match = greeting.toLowerCase().match(/morning|afternoon|evening|night/);
  return match?.[0] ?? 'day';
}

// Per-stat surface + icon treatment — backgrounds from landing-design
// `.ls-stat-tone-*` (readable dual-stop gradients); avoids muddy Tailwind washes.
const STAT_CELL_TONES = [
  {
    toneClass: 'ls-stat-tone-workspaces',
    iconShell:
      'border-indigo-200/80 bg-indigo-50/95 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/12 dark:bg-indigo-500/22 dark:text-indigo-100 dark:shadow-none',
    labelDot: 'bg-indigo-400 dark:bg-indigo-300',
  },
  {
    toneClass: 'ls-stat-tone-live',
    iconShell:
      'border-emerald-200/80 bg-emerald-50/95 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/12 dark:bg-emerald-500/20 dark:text-emerald-100 dark:shadow-none',
    labelDot: 'bg-emerald-400 dark:bg-emerald-300',
  },
  {
    toneClass: 'ls-stat-tone-paid',
    iconShell:
      'border-amber-200/85 bg-amber-50/95 text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/12 dark:bg-amber-500/18 dark:text-amber-100 dark:shadow-none',
    labelDot: 'bg-amber-400 dark:bg-amber-300',
  },
  {
    toneClass: 'ls-stat-tone-mrr',
    iconShell:
      'border-violet-200/80 bg-violet-50/95 text-violet-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/12 dark:bg-violet-500/20 dark:text-violet-100 dark:shadow-none',
    labelDot: 'bg-violet-400 dark:bg-violet-300',
  },
  {
    toneClass: 'ls-stat-tone-ai',
    iconShell:
      'border-sky-200/80 bg-sky-50/95 text-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/12 dark:bg-sky-500/20 dark:text-sky-100 dark:shadow-none',
    labelDot: 'bg-sky-400 dark:bg-sky-300',
  },
] as const;

// ─── Stats strip — single panel, hairline-divided cells ────────────────────

function StatsStrip({
  stats,
  loading,
  error,
}: {
  stats: ReturnType<typeof useTeamDashboardStats>['data'];
  loading: boolean;
  error: boolean;
}) {
  const { t } = useTranslations();

  const setupSub =
    stats && stats.paidCount === 1
      ? t('admin.dashboard.stats.setupPaidSub', { count: stats.paidCount })
      : stats
        ? t('admin.dashboard.stats.setupPaidSubPlural', { count: stats.paidCount })
        : '—';

  const aiSub =
    stats && stats.activeSessions === 1
      ? t('admin.dashboard.stats.aiMtdSub', { count: stats.activeSessions })
      : stats
        ? t('admin.dashboard.stats.aiMtdSubPlural', {
            count: stats.activeSessions,
          })
        : '—';

  const cells: StatCellProps[] = [
    {
      label: t('admin.dashboard.stats.workspaces'),
      value: stats ? String(stats.totalProjects) : null,
      sub: stats
        ? t('admin.dashboard.stats.workspacesSub', {
            draft: stats.draftCount,
            building: stats.inProgressCount,
          })
        : '—',
      icon: FolderKanban,
    },
    {
      label: t('admin.dashboard.stats.live'),
      value: stats ? String(stats.liveCount) : null,
      sub: stats?.liveCount
        ? t('admin.dashboard.stats.liveSubOn')
        : t('admin.dashboard.stats.liveSubOff'),
      live: !!stats && stats.liveCount > 0,
      icon: Globe,
    },
    {
      label: t('admin.dashboard.stats.setupPaid'),
      value: stats ? euro.format(stats.totalSetupFees) : null,
      sub: setupSub,
      icon: Wallet,
    },
    {
      label: t('admin.dashboard.stats.mrr'),
      value: stats ? euro.format(stats.monthlyRevenue) : null,
      sub: stats
        ? t('admin.dashboard.stats.mrrSub', {
            arr: euro.format(stats.monthlyRevenue * 12),
          })
        : '—',
      icon: TrendingUp,
    },
    {
      label: t('admin.dashboard.stats.aiMtd'),
      value: stats ? tokens(stats.aiTokensThisMonth) : null,
      sub: aiSub,
      icon: Sparkles,
    },
  ];

  return (
    <section className="ls-card overflow-hidden !p-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-[var(--ls-rule)]">
        {cells.map((c, i) => (
          <StatCell
            key={`${c.label}-${i}`}
            {...c}
            loading={loading}
            error={error}
            indexInRow={i}
            toneIndex={i}
          />
        ))}
      </div>
    </section>
  );
}

type StatCellProps = {
  label: string;
  value: string | null;
  sub: string;
  live?: boolean;
  icon: LucideIcon;
};

function StatCell({
  label,
  value,
  sub,
  live,
  icon: Icon,
  loading,
  error,
  indexInRow,
  toneIndex,
}: StatCellProps & {
  loading: boolean;
  error: boolean;
  indexInRow: number;
  toneIndex: number;
}) {
  const tone = STAT_CELL_TONES[toneIndex % STAT_CELL_TONES.length]!;

  // Smaller-screen hairline dividers (2-up / 3-up grid)
  const sideRule =
    indexInRow % 2 === 1
      ? 'sm:border-l sm:border-[var(--ls-rule)]'
      : '';
  const topRule = indexInRow >= 2 ? 'border-t border-[var(--ls-rule)]' : '';

  return (
    <div
      className={[
        'ls-stat-cell relative min-h-[124px] px-5 py-5 lg:py-6',
        tone.toneClass,
        sideRule,
        topRule,
        'lg:border-t-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            'inline-flex h-8 w-8 items-center justify-center rounded-[10px] border',
            tone.iconShell,
          ].join(' ')}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ls-ink-faint)]">
          {live ? (
            <PulseDot />
          ) : (
            <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${tone.labelDot}`} />
          )}
          {label}
        </span>
      </div>
      <div
        className="mt-3 text-[2rem] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--ls-ink)]"
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
        className="mt-1 font-mono text-[10.5px] tabular-nums text-[var(--ls-ink-faint)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {loading ? ' ' : sub}
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

// ─── Panel — shared section chrome ──────────────────────────────────────────

function Panel({
  eyebrow,
  title,
  meta,
  action,
  className = '',
  flush = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  meta?: string;
  action?: React.ReactNode;
  className?: string;
  /** When true, the body has zero padding — for tables and the kanban that
   * manage their own internal layout. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`ls-card overflow-hidden !p-0 ${className}`}>
      <header className="flex items-end justify-between gap-4 border-b border-[var(--ls-rule)] px-5 py-3.5 sm:px-6">
        <div>
          {eyebrow && (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ls-ink-faint)]">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-0.5 text-[15px] font-medium tracking-[-0.005em] text-[var(--ls-ink)]">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {meta && (
            <span
              className="hidden font-mono text-[10.5px] tabular-nums text-[var(--ls-ink-faint)] sm:inline"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {meta}
            </span>
          )}
          {action}
        </div>
      </header>
      <div className={flush ? '' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  );
}

// ─── Projects table ─────────────────────────────────────────────────────────

type ProjectRow = {
  id: string;
  name: string | null;
  slug: string | null;
  client_name: string | null;
  client_business_name: string | null;
  concierge_stage: string | null;
  tier_name?: string | null;
  updated_at: string;
  created_at: string;
};

function ProjectsTable({
  rows,
  loading,
  onOpen,
}: {
  rows: ProjectRow[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslations();
  if (loading) return <RowsSkeleton n={6} />;
  if (rows.length === 0) return <ProjectsEmpty />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr>
            <ColHead className="w-[1.5rem] pl-5">{' '}</ColHead>
            <ColHead>{t('admin.dashboard.table.workspace')}</ColHead>
            <ColHead>{t('admin.dashboard.table.account')}</ColHead>
            <ColHead>{t('admin.dashboard.table.tier')}</ColHead>
            <ColHead>{t('admin.dashboard.table.stage')}</ColHead>
            <ColHead className="text-right">
              {t('admin.dashboard.table.updated')}
            </ColHead>
            <ColHead className="w-12 pr-5 text-right">{' '}</ColHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <ProjectRowItem key={p.id} project={p} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ColHead({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-[var(--ls-rule)] px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--ls-ink-faint)] ${className}`}
    >
      {children}
    </th>
  );
}

function ProjectRowItem({
  project,
  onOpen,
}: {
  project: ProjectRow;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslations();
  const stage = project.concierge_stage || 'intake';
  const updatedAt = project.updated_at || project.created_at;
  const client =
    project.client_business_name ||
    project.client_name ||
    t('admin.dashboard.table.emptyAccount');
  const tierKey =
    project.tier_name && TIER_I18N_KEYS[project.tier_name]
      ? TIER_I18N_KEYS[project.tier_name]
      : null;
  const stageKey = STAGE_I18N_KEYS[stage];

  return (
    <tr
      onClick={() => onOpen(project.id)}
      className="group cursor-pointer border-b border-[var(--ls-rule)] last:border-b-0 transition-colors hover:bg-[var(--ls-glass-bg)]"
    >
      <td className="py-3 pl-5">
        <span
          aria-hidden
          className={`inline-block h-2 w-2 rounded-full ${STAGE_DOT[stage]}`}
        />
      </td>
      <td className="px-3 py-3">
        <div className="truncate font-medium text-[var(--ls-ink)]">
          {project.name || t('admin.dashboard.project.untitled')}
        </div>
        {project.slug && (
          <div className="truncate font-mono text-[10.5px] text-[var(--ls-ink-faint)]">
            {project.slug}
          </div>
        )}
      </td>
      <td className="max-w-[14rem] truncate px-3 py-3 text-[var(--ls-ink-dim)]">
        {client}
      </td>
      <td className="px-3 py-3">
        {tierKey ? (
          <span className="rounded-full border border-[var(--ls-rule)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ls-ink-dim)]">
            {t(tierKey)}
          </span>
        ) : (
          <span className="text-[var(--ls-ink-faint)]">—</span>
        )}
      </td>
      <td className="px-3 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--ls-ink-dim)]">
          {stageKey ? t(stageKey) : stage}
        </span>
      </td>
      <td
        className="px-3 py-3 text-right font-mono text-[10.5px] tabular-nums text-[var(--ls-ink-faint)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {updatedAt ? compactRelative(updatedAt) : '—'}
      </td>
      <td className="py-3 pr-5 text-right">
        <ProjectActions project={project} />
      </td>
    </tr>
  );
}

function ProjectActions({ project }: { project: ProjectRow }) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rename = useTeamRenameProject();
  const remove = useTeamDeleteProject();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleRename = () => {
    setOpen(false);
    const next = window.prompt(
      t('admin.dashboard.project.renamePrompt'),
      project.name ?? ''
    );
    if (next == null || next.trim() === '' || next === project.name) return;
    rename.mutate({ id: project.id, name: next.trim() });
  };

  const handleDelete = () => {
    setOpen(false);
    const confirmText = project.name
      ? t('admin.dashboard.project.deleteConfirm', { name: project.name })
      : t('admin.dashboard.project.deleteConfirmUnnamed');
    if (!window.confirm(confirmText)) return;
    remove.mutate(project.id);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ls-ink-faint)] opacity-0 transition-opacity hover:bg-[var(--ls-rule)] hover:text-[var(--ls-ink)] group-hover:opacity-100"
        aria-label={t('admin.dashboard.project.actions.label')}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-[10px] border border-[var(--ls-rule)] bg-[var(--ls-bg)] py-1 text-[13px] shadow-[0_18px_40px_rgba(18,10,34,0.14)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleRename}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--ls-ink-dim)] hover:bg-[var(--ls-glass-bg)] hover:text-[var(--ls-ink)]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('admin.dashboard.project.actions.rename')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('admin.dashboard.project.actions.delete')}
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectsEmpty() {
  const { t } = useTranslations();
  return (
    <div className="px-5 py-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ls-ink-faint)]">
        {t('admin.dashboard.projects.emptyTitle')}
      </div>
      <p className="mx-auto mt-2.5 max-w-xs text-[13px] text-[var(--ls-ink-dim)]">
        {t('admin.dashboard.projects.emptyBody')}
      </p>
      <Link
        href="/admin/dashboard/new"
        className="ls-cta ls-cta--sm mt-5 inline-flex"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('admin.dashboard.cta.newWorkspace')}
      </Link>
    </div>
  );
}

// ─── Clients table ──────────────────────────────────────────────────────────

function ClientsTable({
  rows,
  loading,
}: {
  rows: Client[];
  loading: boolean;
}) {
  const { t } = useTranslations();
  if (loading) return <RowsSkeleton n={6} />;
  if (rows.length === 0) return <ClientsEmpty />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr>
            <ColHead className="pl-5">
              {t('admin.dashboard.clients.col.account')}
            </ColHead>
            <ColHead>{t('admin.dashboard.clients.col.contact')}</ColHead>
            <ColHead>{t('admin.dashboard.clients.col.tier')}</ColHead>
            <ColHead className="text-right">
              {t('admin.dashboard.clients.col.workspaces')}
            </ColHead>
            <ColHead className="text-right">
              {t('admin.dashboard.clients.col.setupPaid')}
            </ColHead>
            <ColHead className="text-right">
              {t('admin.dashboard.clients.col.lastActivity')}
            </ColHead>
            <ColHead className="w-24 pr-5 text-right">
              {t('admin.dashboard.clients.col.actions')}
            </ColHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <ClientRowItem key={c.key} client={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientRowItem({ client }: { client: Client }) {
  const { t } = useTranslations();
  const dash = t('admin.dashboard.table.emptyAccount');
  const display =
    client.businessName ||
    client.name ||
    client.email ||
    t('admin.dashboard.clients.unnamed');
  const subline =
    client.businessName && client.name
      ? client.name
      : client.email && (client.businessName || client.name)
        ? client.email
        : '';
  const initials =
    (client.businessName || client.name || client.email || '?')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((w) => w[0]!)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const tierLabel = client.tiers
    .map((tier) =>
      TIER_I18N_KEYS[tier] ? t(TIER_I18N_KEYS[tier]!) : tier
    )
    .filter(Boolean)
    .join(', ');

  return (
    <tr className="group border-b border-[var(--ls-rule)] last:border-b-0 transition-colors hover:bg-[var(--ls-glass-bg)]">
      <td className="py-3 pl-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ls-rule)] bg-[var(--ls-bg)] font-mono text-[10.5px] font-medium uppercase text-[var(--ls-ink-dim)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-[var(--ls-ink)]">
              {display}
            </div>
            {subline && (
              <div className="truncate text-[11.5px] text-[var(--ls-ink-faint)]">
                {subline}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="max-w-[14rem] truncate px-3 py-3 text-[var(--ls-ink-dim)]">
        <div className="flex flex-col">
          {client.email ? (
            <span className="truncate text-[13px]">{client.email}</span>
          ) : null}
          {client.phone ? (
            <span className="font-mono text-[10.5px] text-[var(--ls-ink-faint)]">
              {client.phone}
            </span>
          ) : null}
          {!client.email && !client.phone && (
            <span className="text-[var(--ls-ink-faint)]">—</span>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        {tierLabel ? (
          <span className="rounded-full border border-[var(--ls-rule)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ls-ink-dim)]">
            {tierLabel}
          </span>
        ) : (
          <span className="text-[var(--ls-ink-faint)]">—</span>
        )}
      </td>
      <td
        className="px-3 py-3 text-right font-mono text-[12.5px] tabular-nums text-[var(--ls-ink)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {client.projectCount}
      </td>
      <td
        className="px-3 py-3 text-right font-mono text-[12.5px] tabular-nums text-[var(--ls-ink-dim)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {euro.format(client.totalFee || 0)}
      </td>
      <td
        className="px-3 py-3 text-right font-mono text-[10.5px] tabular-nums text-[var(--ls-ink-faint)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {client.lastActivity ? compactRelative(client.lastActivity) : dash}
      </td>
      <td className="py-3 pr-5 text-right">
        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ls-ink-faint)] hover:bg-[var(--ls-rule)] hover:text-[var(--ls-ink)]"
              aria-label={t('admin.dashboard.clients.emailAria', {
                name: display,
              })}
              title={t('admin.dashboard.clients.emailAria', { name: display })}
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ls-ink-faint)] hover:bg-[var(--ls-rule)] hover:text-[var(--ls-ink)]"
              aria-label={t('admin.dashboard.clients.callAria', {
                name: display,
              })}
              title={t('admin.dashboard.clients.callAria', { name: display })}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function ClientsEmpty() {
  const { t } = useTranslations();
  return (
    <div className="px-5 py-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ls-ink-faint)]">
        {t('admin.dashboard.clients.emptyTitle')}
      </div>
      <p className="mx-auto mt-2.5 max-w-md text-[13px] text-[var(--ls-ink-dim)]">
        {t('admin.dashboard.clients.emptyBody')}
      </p>
      <Link
        href="/admin/dashboard/new"
        className="mt-5 inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--ls-ink-dim)] hover:text-[var(--ls-ink)]"
      >
        {t('admin.dashboard.clients.emptyNextStep')}
      </Link>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function RowsSkeleton({ n }: { n: number }) {
  return (
    <ul className="divide-y divide-[var(--ls-rule)]">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-3">
          <span className="h-2 w-2 rounded-full bg-[var(--ls-rule)]" />
          <div className="h-3 flex-1 animate-pulse rounded-sm bg-[var(--ls-rule)]" />
          <div className="h-3 w-16 animate-pulse rounded-sm bg-[var(--ls-rule)]" />
        </li>
      ))}
    </ul>
  );
}
