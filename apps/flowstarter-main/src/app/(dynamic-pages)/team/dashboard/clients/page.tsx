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
      className="group cursor-pointer rounded-[24px] border border-gray-200/80 bg-white/95 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset]"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-[var(--purple)]">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {client.name}
            </h3>
            {hasLive && (
              <span className="px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-gray-400 dark:text-white/30 shrink-0" />
            <span className="text-xs text-gray-500 dark:text-white/40 truncate">
              {client.email}
            </span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-gray-400 dark:text-white/30 shrink-0" />
              <span className="text-xs text-gray-500 dark:text-white/40">
                {client.phone}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <FolderOpen className="w-3 h-3 text-gray-400 dark:text-white/30" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {client.projectCount}
          </p>
          <p className="text-[0.6rem] text-gray-400 dark:text-white/30">
            Projects
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <TrendingUp className="w-3 h-3 text-gray-400 dark:text-white/30" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            €{client.totalFee.toLocaleString()}
          </p>
          <p className="text-[0.6rem] text-gray-400 dark:text-white/30">
            Total fees
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-0.5">
            <Clock className="w-3 h-3 text-gray-400 dark:text-white/30" />
          </div>
          <p className="text-[0.65rem] font-medium text-gray-700 dark:text-white/60 leading-tight">
            {ago}
          </p>
          <p className="text-[0.6rem] text-gray-400 dark:text-white/30">
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
      maxWidth="5xl"
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
              className="rounded-[24px] border border-gray-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-white/[0.05] h-48 animate-pulse"
            />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-500">Failed to load clients.</p>}
      {!isLoading && !error && clients.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/40">
            No clients yet
          </p>
          <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
            Create your first project to see clients here
          </p>
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
