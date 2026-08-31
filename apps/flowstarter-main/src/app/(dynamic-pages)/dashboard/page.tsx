/**
 * The one door every signed-in user comes through.
 *
 * This used to redirect *everybody* to `/admin/dashboard`, so a client who
 * signed in landed in the operator console — other tenants' projects, billing
 * controls, the lot. Role decides now: operators keep the console, a client
 * goes to their own project, and someone with neither gets an honest empty
 * state instead of a console they should never have seen.
 */
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveUserRole } from '@/lib/api-auth';
import { listClientWorkspaces } from './client-workspaces';

export const dynamic = 'force-dynamic';

export default async function DashboardIndexPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login?next=/dashboard');

  // Team and admin roles are cross-tenant by design; their home is the console.
  const role = await resolveUserRole(userId);
  if (role === 'team' || role === 'admin') redirect('/admin/dashboard');

  const workspaces = await listClientWorkspaces(userId);
  if (workspaces.length === 1)
    redirect(`/dashboard/projects/${workspaces[0].id}`);
  if (workspaces.length > 1) redirect('/dashboard/projects');

  return <NoProjectYet />;
}

/**
 * A signed-in person with no membership row. Usually they signed in before the
 * claim finished. Telling them that is far better than a redirect loop or, as
 * before, the operator console.
 */
function NoProjectYet() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-5 py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)]">
        Your projects
      </p>
      <h1 className="mb-4 text-3xl font-bold leading-tight text-[var(--fs-ink)]">
        Nothing here yet
      </h1>
      <p className="mb-7 max-w-xl text-base leading-relaxed text-[var(--fs-ink)]/75">
        You&apos;re signed in, but no project is linked to this account yet.
        Your project appears here as soon as it&apos;s been claimed, that
        normally happens right after you open the preview link we sent you.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="inline-flex w-fit items-center rounded-full bg-[var(--fs-ink)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Talk to us
        </Link>
        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-full border border-[var(--fs-ink)]/20 px-6 py-3 text-sm font-semibold text-[var(--fs-ink)] transition-colors hover:bg-[var(--fs-ink)]/5"
        >
          Back to Flowstarter
        </Link>
      </div>
    </main>
  );
}
