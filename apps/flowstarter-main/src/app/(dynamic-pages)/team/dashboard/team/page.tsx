'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, Mail, Clock, UserPlus, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Member {
  id: string; name: string; email: string; role: string;
  createdAt: string; lastSignIn: string | null;
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === 'admin';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider ${
      isAdmin
        ? 'bg-[var(--purple)]/10 text-[var(--purple)] dark:bg-[var(--purple)]/20 dark:text-[#a5b4fc]'
        : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40'
    }`}>
      {isAdmin && <Crown className="w-2.5 h-2.5" />}
      {role}
    </span>
  );
}

function MemberRow({ member }: { member: Member }) {
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const joinedAgo = formatDistanceToNow(new Date(member.createdAt), { addSuffix: true });
  const lastSeenAgo = member.lastSignIn
    ? formatDistanceToNow(new Date(member.lastSignIn), { addSuffix: true })
    : 'Never';

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-[20px] border border-gray-200/80 bg-white/95 dark:border-white/[0.06] dark:bg-white/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center shrink-0 text-sm font-bold text-[var(--purple)]">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</p>
          <RoleBadge role={member.role} />
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3 text-gray-400 dark:text-white/30 shrink-0" />
          <span className="text-xs text-gray-500 dark:text-white/40 truncate">{member.email}</span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/30">
          <Clock className="w-3 h-3" />
          <span>{lastSeenAgo}</span>
        </div>
        <span className="text-[0.6rem] text-gray-400 dark:text-white/25">Joined {joinedAgo}</span>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/team/members');
      if (!res.ok) throw new Error('Failed to load team');
      return res.json() as Promise<{ members: Member[] }>;
    },
  });

  const members = data?.members ?? [];
  const admins = members.filter(m => m.role.toLowerCase() === 'admin');
  const team   = members.filter(m => m.role.toLowerCase() !== 'admin');

  return (
    <div className="py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[var(--purple)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Team</h1>
              <p className="text-xs text-gray-500 dark:text-white/40">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/team/dashboard/invite')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Invite
          </button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-[20px] border border-gray-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-white/[0.05] animate-pulse" />)}
          </div>
        )}
        {error && <p className="text-sm text-red-500">Failed to load team members.</p>}

        {!isLoading && !error && (
          <div className="space-y-6">
            {admins.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> Admins
                </h2>
                <div className="space-y-2">
                  {admins.map(m => <MemberRow key={m.id} member={m} />)}
                </div>
              </section>
            )}
            {team.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Team members
                </h2>
                <div className="space-y-2">
                  {team.map(m => <MemberRow key={m.id} member={m} />)}
                </div>
              </section>
            )}
            {members.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-white/40">No team members found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
