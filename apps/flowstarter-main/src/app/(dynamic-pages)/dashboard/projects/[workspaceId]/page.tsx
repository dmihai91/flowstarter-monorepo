/**
 * A client's own project, and nothing else.
 *
 * Everything below the authorization check is read with the service role,
 * which bypasses RLS — so `requireWorkspaceAccess` is the only thing standing
 * between a client and another tenant's project. It runs first, before a
 * single row is fetched, and a caller who is not a member gets `notFound()`:
 * the same 404 the API returns, so the page does not confirm the id is real.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireWorkspaceAccess } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { OpenAsks } from '@/components/flowstarter/OpenAsks';
import { ProjectStateStepper } from '@/components/flowstarter/ProjectStateStepper';
import { ProjectThread } from '@/components/flowstarter/ProjectThread';
import { messagesFromPayload } from '@/components/flowstarter/project-messages';
import { projectStateFrom } from '@/components/flowstarter/project-progress';
import {
  formatMinor,
  projectPayments,
} from '@/components/flowstarter/project-payment';
import { resolveSiteLink } from '@/components/flowstarter/site-link';
import { workspaceDisplayName } from '../../client-workspaces';

export const dynamic = 'force-dynamic';

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const access = await requireWorkspaceAccess(workspaceId);
  if (!access.authorized) {
    // A signed-out caller should be asked to sign in; everything else — wrong
    // tenant, malformed id — is a 404, which tells a prober nothing.
    if (access.response.status === 401) {
      redirect(`/login?next=/dashboard/projects/${workspaceId}`);
    }
    notFound();
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: workspace } = await supabase
    .from('workspaces')
    .select(
      `id, slug, name, client_business_name, project_state, deploy_status,
       final_value_minor, setup_fee, billing_currency, deposit_status,
       final_status, final_invoice_url`
    )
    .eq('id', workspaceId)
    .maybeSingle();
  if (!workspace) notFound();

  const [{ data: hosts }, { data: messageRows }] = await Promise.all([
    supabase
      .from('workspace_hosts')
      .select('hostname, is_primary')
      .eq('workspace_id', workspaceId),
    supabase
      .from('project_messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true }),
  ]);

  // Same normaliser the thread uses on the API's camelCase payload, so a raw
  // row and a fetched message render identically.
  const messages = messagesFromPayload(messageRows ?? []);
  const state = projectStateFrom(workspace.project_state);
  const payments = projectPayments(workspace, workspaceId);
  const site = resolveSiteLink({
    slug: workspace.slug,
    deployStatus: workspace.deploy_status,
    hosts: hosts ?? [],
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--purple-primary)]">
          Your project
        </p>
        <h1 className="text-3xl font-bold leading-tight text-[var(--fs-ink)]">
          {workspaceDisplayName({
            name: workspace.name,
            clientBusinessName: workspace.client_business_name ?? null,
          })}
        </h1>
        {site ? (
          <a
            href={site.href}
            target="_blank"
            rel="noreferrer noopener"
            data-testid="site-link"
            className="w-fit text-sm font-semibold text-[var(--fs-ink)] underline underline-offset-4"
          >
            {site.label} · {site.hostname}
          </a>
        ) : null}
        {/* The editor authorizes itself; this link is a shortcut, not a gate. */}
        <Link
          href={`/dashboard/projects/${workspaceId}/editor`}
          data-testid="site-editor-link"
          className="w-fit text-sm font-semibold text-[var(--purple-primary)] underline underline-offset-4"
        >
          Edit your site
        </Link>
      </header>

      <section className="rounded-2xl border border-[var(--fs-ink)]/10 bg-white/60 px-6 py-6">
        <ProjectStateStepper state={state} />
      </section>

      {payments.due ? (
        <section
          data-testid={`payment-cta-${payments.due.kind}`}
          className="flex flex-col gap-3 rounded-2xl border border-[var(--fs-ink)]/15 bg-white/70 px-6 py-6"
        >
          <h2 className="text-base font-bold text-[var(--fs-ink)]">
            {payments.due.kind === 'deposit'
              ? 'Start the build'
              : 'Settle the balance'}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--fs-ink)]/70">
            {payments.due.explainer}
          </p>
          <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-[var(--fs-ink)]/60">Due now</dt>
              <dd className="font-bold text-[var(--fs-ink)]">
                {formatMinor(payments.due.amountMinor, payments.due.currency)}
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-[var(--fs-ink)]/60">Total quoted</dt>
              <dd className="font-semibold text-[var(--fs-ink)]/80">
                {formatMinor(payments.quoteMinor, payments.currency)}
              </dd>
            </div>
          </dl>
          <Link
            href={payments.due.href}
            className="inline-flex w-fit items-center rounded-full bg-[var(--fs-ink)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {payments.due.label}
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--fs-ink)]/10 bg-white/60 px-6 py-6">
        {/* `workspaceId` is what turns each ask into an upload control; the
            uploader posts to /api/client/assets/[workspaceId], which runs the
            same access check this page did. */}
        <OpenAsks messages={messages} workspaceId={workspaceId} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--fs-ink)]/10 bg-white/60 px-6 py-6">
        <h2 className="text-base font-bold text-[var(--fs-ink)]">Messages</h2>
        <ProjectThread
          workspaceId={workspaceId}
          initialMessages={messages}
          viewerSide="client"
          replyPlaceholder="Reply to us here…"
        />
      </section>
    </main>
  );
}
