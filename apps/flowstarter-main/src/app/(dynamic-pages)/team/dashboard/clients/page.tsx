'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users,
  Mail,
  Phone,
  FolderOpen,
  TrendingUp,
  Clock,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TeamDashboardShell } from '../components/TeamDashboardShell';

interface Client {
  userId: string;
  name: string;
  email: string;
  phone: string;
  projectCount: number;
  totalFee: number;
  statuses: string[];
  lastActivity: string;
}

function ClientCard({ client }: { client: Client }) {
  const router = useRouter();
  const hasLive = client.statuses.some((s) => s === 'live');
  const initials =
    client.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  const ago = client.lastActivity
    ? formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })
    : 'Unknown';

  return (
    <div
      onClick={() => router.push(`/team/dashboard?client=${client.userId}`)}
      className="group cursor-pointer rounded-[var(--fs-radius-2xl)] border p-5 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--fs-glass-bg)',
        borderColor: 'var(--fs-glass-edge)',
        boxShadow: 'var(--fs-card-shadow)',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-[var(--purple)]">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--fs-ink)] truncate">
              {client.name}
            </h3>
            {hasLive && (
              <span className="px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-[var(--fs-ink-faint)] shrink-0" />
            <span className="text-xs text-[var(--fs-ink-faint)] truncate">
              {client.email}
            </span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-[var(--fs-ink-faint)] shrink-0" />
              <span className="text-xs text-[var(--fs-ink-faint)]">
                {client.phone}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--fs-rule)] grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <FolderOpen className="w-3 h-3 text-[var(--fs-ink-faint)]" />
          </div>
          <p className="text-sm font-bold text-[var(--fs-ink)]">
            {client.projectCount}
          </p>
          <p className="text-[0.6rem] text-[var(--fs-ink-faint)]">Projects</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <TrendingUp className="w-3 h-3 text-[var(--fs-ink-faint)]" />
          </div>
          <p className="text-sm font-bold text-[var(--fs-ink)]">
            €{client.totalFee.toLocaleString()}
          </p>
          <p className="text-[0.6rem] text-[var(--fs-ink-faint)]">Total fees</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <Clock className="w-3 h-3 text-[var(--fs-ink-faint)]" />
          </div>
          <p className="text-[0.65rem] font-medium text-[var(--fs-ink-dim)] leading-tight">
            {ago}
          </p>
          <p className="text-[0.6rem] text-[var(--fs-ink-faint)]">
            Last active
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-clients'],
    queryFn: async () => {
      const res = await fetch('/api/team/clients');
      if (!res.ok) throw new Error('Failed to load clients');
      return res.json() as Promise<{ clients: Client[] }>;
    },
  });

  const clients = data?.clients ?? [];

  return (
    <TeamDashboardShell
      title={`Clients · ${clients.length}`}
      subtitle="All clients derived from your projects"
      icon={<Users className="w-5 h-5 text-[var(--purple)]" />}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={() => router.push('/team/dashboard/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
        >
          <Plus className="w-4 h-4" /> New project
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[var(--fs-radius-2xl)] border h-48 animate-pulse"
              style={{
                background: 'var(--fs-glass-bg)',
                borderColor: 'var(--fs-glass-edge)',
              }}
            />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-500">Failed to load clients.</p>}
      {!isLoading && !error && clients.length === 0 && (
        <div
          className="rounded-[var(--fs-radius-2xl)] border p-12 text-center backdrop-blur-2xl backdrop-saturate-150"
          style={{
            background: 'var(--fs-glass-bg)',
            borderColor: 'var(--fs-glass-edge)',
            boxShadow: 'var(--fs-card-shadow)',
          }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/55 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
            <Users className="w-8 h-8 text-[var(--fs-ink-faint)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--fs-ink)] mb-2">
            No clients yet
          </h3>
          <p className="text-[var(--fs-ink-faint)] mb-6 max-w-sm mx-auto text-sm">
            Create your first project to see clients here.
          </p>
          <button
            onClick={() => router.push('/team/dashboard/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
          >
            <Plus className="w-4 h-4" /> New project
          </button>
        </div>
      )}
      {!isLoading && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <ClientCard key={c.userId} client={c} />
          ))}
        </div>
      )}
    </TeamDashboardShell>
  );
}
