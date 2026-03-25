'use client';

import { Suspense } from 'react';
import { TeamProjectsList } from '../../components/TeamProjectsList';
import { TeamProjectsListSkeleton } from '../../components/TeamProjectsListSkeleton';
import { FolderOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AllProjectsPage() {
  const router = useRouter();
  return (
    <div className="py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--purple)]/10 border border-[var(--purple)]/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-[var(--purple)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">All Projects</h1>
              <p className="text-xs text-gray-500 dark:text-white/40">Every project across all clients</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/team/dashboard/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--purple)] text-white text-sm font-semibold hover:bg-[var(--purple)]/90 transition-all"
          >
            <Plus className="w-4 h-4" /> New project
          </button>
        </div>
        <Suspense fallback={<TeamProjectsListSkeleton />}>
          <TeamProjectsList />
        </Suspense>
      </div>
    </div>
  );
}
