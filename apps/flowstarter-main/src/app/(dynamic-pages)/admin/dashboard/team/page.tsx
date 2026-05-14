'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, Mail, Clock, UserPlus, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/format-utils';
import {
  TeamDashboardShell,
  ShellCard,
} from '../components/TeamDashboardShell';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === 'admin';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider ${
        isAdmin
          ? 'bg-[var(--purple)]/10 text-[var(--purple)] dark:bg-[var(--purple)]/20 dark:text-[#a5b4fc]'
          : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40'
      }`}
    >
      {isAdmin && <Crown className="w-2.5 h-2.5" />}
      {role}
    </span>
  );
}

function MemberRow({ member }: { member: Member }) {
  const initials = getInitials(member.name);
  const joinedAgo = formatDistanceToNow(new Date(member.createdAt), {
    addSuffix: true,
  });
  const lastSeenAgo = member.lastSignIn
    ? formatDistanceToNow(new Date(member.lastSignIn), { addSuffix: true })
    : 'Never';

  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0 text-base font-bold text-[var(--purple)]">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold text-[var(--fs-ink)]">
            {member.name}
          </p>
          <RoleBadge role={member.role} />
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Mail className="w-3.5 h-3.5 text-[var(--fs-ink-faint)] shrink-0" />
          <span className="text-sm text-[var(--fs-ink-faint)] truncate">
            {member.email}
          </span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-sm text-[var(--fs-ink-faint)]">
          <Clock className="w-3.5 h-3.5" />
          <span>{lastSeenAgo}</span>
        </div>
        <span className="text-xs text-[var(--fs-ink-faint)]">
          Joined {joinedAgo}
        </span>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/admin/members');
      if (!res.ok) throw new Error('Failed to load team');
      return res.json() as Promise<{ members: Member[] }>;
    },
  });

  const members = data?.members ?? [];
  const admins = members.filter((m) => m.role.toLowerCase() === 'admin');
  const team = members.filter((m) => m.role.toLowerCase() !== 'admin');

  return (
    <TeamDashboardShell
      title={`Team · ${members.length} member${
        members.length !== 1 ? 's' : ''
      }`}
      subtitle="Manage who has access to the dashboard"
      icon={<ShieldCheck className="w-5 h-5 text-[var(--purple)]" />}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={() => router.push('/admin/dashboard/invite')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Invite
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-[var(--fs-rule)]  animate-pulse"
            />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-500">Failed to load team members.</p>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {admins.length > 0 && (
            <ShellCard className="!p-0 overflow-hidden">
              <p className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-600 dark:text-white/50 flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                Admins
              </p>
              <div className="divide-y divide-[var(--fs-rule)]">
                {admins.map((m) => (
                  <MemberRow key={m.id} member={m} />
                ))}
              </div>
            </ShellCard>
          )}
          {team.length > 0 && (
            <ShellCard className="!p-0 overflow-hidden">
              <p className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-600 dark:text-white/50 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Team members
              </p>
              <div className="divide-y divide-[var(--fs-rule)]">
                {team.map((m) => (
                  <MemberRow key={m.id} member={m} />
                ))}
              </div>
            </ShellCard>
          )}
          {members.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-10 h-10 text-[var(--fs-ink-faint)] mx-auto mb-3" />
              <p className="text-sm text-[var(--fs-ink-faint)]">
                No team members found
              </p>
            </div>
          )}
        </div>
      )}
    </TeamDashboardShell>
  );
}
