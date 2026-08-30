/**
 * A client's project list.
 *
 * Most clients have exactly one project, and a list of one is a page nobody
 * needs to read, so that case redirects straight through to the project.
 */
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveUserRole } from '@/lib/api-auth';
import {
  listClientWorkspaces,
  workspaceDisplayName,
} from '../client-workspaces';
import {
  currentStage,
  projectStateFrom,
} from '@/components/flowstarter/project-progress';

export const dynamic = 'force-dynamic';

export default async function ClientProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login?next=/dashboard/projects');

  const role = await resolveUserRole(userId);
  if (role === 'team' || role === 'admin') redirect('/admin/dashboard');

  const workspaces = await listClientWorkspaces(userId);
  if (workspaces.length === 0) redirect('/dashboard');
  if (workspaces.length === 1)
    redirect(`/dashboard/projects/${workspaces[0].id}`);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)]">
        Your projects
      </p>
      <h1 className="mb-8 text-3xl font-bold leading-tight text-[var(--fs-ink)]">
        Pick a project
      </h1>
      <ul className="flex flex-col gap-3">
        {workspaces.map((workspace) => {
          const stage = currentStage(projectStateFrom(workspace.projectState));
          return (
            <li key={workspace.id}>
              <Link
                href={`/dashboard/projects/${workspace.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/60 px-5 py-4 transition-colors hover:border-[var(--fs-ink)]/30"
              >
                <span className="text-base font-semibold text-[var(--fs-ink)]">
                  {workspaceDisplayName(workspace)}
                </span>
                <span className="text-sm text-[var(--fs-ink)]/65">
                  {stage.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
