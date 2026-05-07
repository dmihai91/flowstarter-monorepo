'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeamProject } from '@/hooks/useTeamProjects';
import { OverviewTab } from './components/OverviewTab';
import { ConciergeTab } from './components/ConciergeTab';
import { CommerceTab } from './components/CommerceTab';
import { CommerceProductsTab } from './components/CommerceProductsTab';
import { HostingTab } from './components/HostingTab';
import { BillingTab } from './components/BillingTab';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: project, isLoading, error } = useTeamProject(id);

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-10 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/team/dashboard/projects')}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Projects
        </button>
        <p className="text-sm text-red-500">Could not load project.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/team/dashboard/projects')}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Projects
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--fs-rule-accent)] bg-[var(--fs-accent-bg)] text-[var(--fs-accent)]">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--fs-ink)] truncate">
              {isLoading ? 'Loading…' : project?.name || 'Untitled project'}
            </h1>
            <p className="text-sm text-[var(--fs-ink-faint)] truncate">
              {project?.client_business_name ||
                project?.client_name ||
                project?.client_email ||
                'Unassigned'}
            </p>
          </div>
        </div>

        {isLoading || !project ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl border animate-pulse"
                style={{
                  background: 'var(--fs-glass-bg)',
                  borderColor: 'var(--fs-glass-edge)',
                }}
              />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="concierge">Concierge</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="hosting">Hosting</TabsTrigger>
              <TabsTrigger value="commerce">Commerce</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OverviewTab project={project} />
            </TabsContent>
            <TabsContent value="concierge" className="mt-6">
              <ConciergeTab project={project} />
            </TabsContent>
            <TabsContent value="billing" className="mt-6">
              <BillingTab project={project} />
            </TabsContent>
            <TabsContent value="hosting" className="mt-6">
              <HostingTab project={project} />
            </TabsContent>
            <TabsContent value="commerce" className="mt-6">
              <CommerceTab project={project} />
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <CommerceProductsTab project={project} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
