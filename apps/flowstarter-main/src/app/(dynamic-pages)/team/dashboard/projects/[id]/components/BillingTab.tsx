'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Receipt,
  RefreshCcw,
  Ban,
  PlayCircle,
} from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import type { Project } from './form-helpers';

type InvoiceState = 'pending' | 'sent' | 'paid' | 'overdue' | null | string;
type SubscriptionState =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'incomplete'
  | string
  | null;

const INVOICE_TONE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  sent: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  pending:
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

const SUBSCRIPTION_TONE: Record<string, string> = {
  trial: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  active:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  past_due: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  cancelled:
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400',
  incomplete:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

function StatusPill({
  status,
  tone,
}: {
  status: string;
  tone: Record<string, string>;
}) {
  const cls = tone[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${cls}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function BillingTab({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const setupFee = (project.setup_fee as number | null) ?? 0;
  const monthlyFee = (project.monthly_fee as number | null) ?? 0;
  const depositStatus = (project.deposit_status as InvoiceState) ?? 'pending';
  const finalStatus = (project.final_status as InvoiceState) ?? 'pending';
  const subscriptionStatus =
    (project.subscription_status as SubscriptionState) ?? null;
  const stripeSubscriptionId = project.stripe_subscription_id as string | null;
  const stripeCustomerId = project.stripe_customer_id as string | null;
  const depositInvoiceUrl = project.deposit_invoice_url as string | null;
  const finalInvoiceUrl = project.final_invoice_url as string | null;
  const subscriptionTrialEnds = project.subscription_trial_ends as
    | string
    | null;
  const subscriptionNextBilling = project.subscription_next_billing as
    | string
    | null;

  const callBilling = useMutation({
    mutationFn: async (vars: {
      action:
        | 'deposit-invoice'
        | 'final-invoice'
        | 'activate-subscription'
        | 'cancel-subscription';
      query?: string;
    }) => {
      setBusy(vars.action);
      const res = await fetch(
        `/api/team/projects/${project.id}/billing/${vars.action}${
          vars.query ?? ''
        }`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Billing call failed');
      }
      return res.json();
    },
    onSettled: () => setBusy(null),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['team-project', project.id] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
      if (vars.action === 'deposit-invoice')
        toast.success('Deposit invoice sent');
      else if (vars.action === 'final-invoice')
        toast.success('Final invoice sent');
      else if (vars.action === 'activate-subscription')
        toast.success('Subscription activated');
      else if (vars.action === 'cancel-subscription')
        toast.success('Subscription cancelled');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
  });

  const canSendDeposit =
    !!project.client_email && setupFee > 0 && depositStatus !== 'paid';
  const canSendFinal =
    !!project.client_email &&
    setupFee > 0 &&
    depositStatus === 'paid' &&
    finalStatus !== 'paid';
  const canActivateSubscription =
    !!project.client_email &&
    monthlyFee > 0 &&
    !stripeSubscriptionId &&
    finalStatus === 'paid';
  const canCancelSubscription =
    !!stripeSubscriptionId && subscriptionStatus !== 'cancelled';

  return (
    <div className="space-y-4">
      {!project.client_email && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="inline-block w-4 h-4 mr-1 -mt-0.5" />
          Set <strong>Client email</strong> on the Overview tab before
          generating invoices — Stripe needs it to create a Customer.
        </div>
      )}

      {/* Setup fee — two invoices */}
      <ShellCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--fs-ink)]">
              Setup fee
            </h3>
            <p className="text-xs text-[var(--fs-ink-faint)]">
              Two invoices: 50% deposit upfront + 50% on approval.
            </p>
          </div>
          <p className="text-sm font-bold text-[var(--fs-ink)]">
            €{setupFee.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Deposit */}
          <div className="rounded-lg border border-[var(--fs-rule)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--fs-ink-dim)]">
                Deposit (50%)
              </span>
              <StatusPill status={depositStatus} tone={INVOICE_TONE} />
            </div>
            <p className="text-lg font-semibold text-[var(--fs-ink)]">
              €{Math.round(setupFee * 0.5).toLocaleString()}
            </p>
            {depositInvoiceUrl && (
              <a
                href={depositInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[0.65rem] text-[var(--purple)] hover:underline"
              >
                Hosted invoice <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {depositStatus === 'paid' && project.deposit_paid_at && (
              <p className="mt-1 text-[0.65rem] text-[var(--fs-ink-faint)]">
                Paid {formatDate(project.deposit_paid_at as string)}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                disabled={!canSendDeposit || busy !== null}
                onClick={() =>
                  callBilling.mutate({ action: 'deposit-invoice' })
                }
                variant="outline"
              >
                <Send className="w-3.5 h-3.5" />
                {busy === 'deposit-invoice'
                  ? 'Sending…'
                  : depositStatus === 'sent'
                  ? 'Resend deposit'
                  : 'Send deposit'}
              </Button>
            </div>
          </div>

          {/* Final */}
          <div className="rounded-lg border border-[var(--fs-rule)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--fs-ink-dim)]">
                Final (50%)
              </span>
              <StatusPill status={finalStatus} tone={INVOICE_TONE} />
            </div>
            <p className="text-lg font-semibold text-[var(--fs-ink)]">
              €{Math.round(setupFee * 0.5).toLocaleString()}
            </p>
            {finalInvoiceUrl && (
              <a
                href={finalInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[0.65rem] text-[var(--purple)] hover:underline"
              >
                Hosted invoice <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {finalStatus === 'paid' && project.final_paid_at && (
              <p className="mt-1 text-[0.65rem] text-[var(--fs-ink-faint)]">
                Paid {formatDate(project.final_paid_at as string)}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                disabled={!canSendFinal || busy !== null}
                onClick={() => callBilling.mutate({ action: 'final-invoice' })}
                variant="outline"
              >
                <Send className="w-3.5 h-3.5" />
                {busy === 'final-invoice'
                  ? 'Sending…'
                  : finalStatus === 'sent'
                  ? 'Resend final'
                  : 'Send final'}
              </Button>
            </div>
          </div>
        </div>
      </ShellCard>

      {/* Subscription */}
      <ShellCard>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--fs-ink)]">
              Subscription
            </h3>
            <p className="text-xs text-[var(--fs-ink-faint)]">
              Recurring monthly fee with 30-day trial (first month free).
            </p>
          </div>
          {subscriptionStatus && (
            <StatusPill status={subscriptionStatus} tone={SUBSCRIPTION_TONE} />
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Monthly amount
            </dt>
            <dd className="font-semibold text-[var(--fs-ink)]">
              €{monthlyFee.toLocaleString()}/mo
            </dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Trial ends
            </dt>
            <dd className="text-[var(--fs-ink-dim)]">
              {formatDate(subscriptionTrialEnds)}
            </dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Next billing
            </dt>
            <dd className="text-[var(--fs-ink-dim)]">
              {formatDate(subscriptionNextBilling)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--fs-rule)]">
          <Button
            size="sm"
            disabled={!canActivateSubscription || busy !== null}
            onClick={() => {
              if (!canActivateSubscription) return;
              callBilling.mutate({ action: 'activate-subscription' });
            }}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            {busy === 'activate-subscription'
              ? 'Activating…'
              : 'Activate subscription'}
          </Button>

          {!canActivateSubscription && !stripeSubscriptionId && (
            <p className="text-[0.65rem] text-[var(--fs-ink-faint)]">
              Available once both invoices are paid (or pass force=true via
              API).
            </p>
          )}

          {canCancelSubscription && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => {
                  if (
                    !confirm(
                      'Cancel at period end? Client keeps service through what they already paid for.'
                    )
                  )
                    return;
                  callBilling.mutate({ action: 'cancel-subscription' });
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                Cancel at period end
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => {
                  if (
                    !confirm(
                      'Cancel IMMEDIATELY? Service stops now. Refunds handled separately.'
                    )
                  )
                    return;
                  callBilling.mutate({
                    action: 'cancel-subscription',
                    query: '?immediate=true',
                  });
                }}
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel now
              </Button>
            </>
          )}
        </div>
      </ShellCard>

      {/* Stripe references */}
      <ShellCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--fs-ink)] flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Stripe references
          </h3>
          {stripeCustomerId && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy === 'portal-link'}
              onClick={async () => {
                setBusy('portal-link');
                try {
                  const res = await fetch(
                    `/api/team/projects/${project.id}/billing/portal-link`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    }
                  );
                  const data = await res.json();
                  if (!res.ok || !data.url) {
                    toast.error(data.error || 'Failed to create portal link');
                    return;
                  }
                  await navigator.clipboard.writeText(data.url);
                  toast.success(
                    'Portal link copied — paste into the client email'
                  );
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : 'Portal link failed'
                  );
                } finally {
                  setBusy(null);
                }
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {busy === 'portal-link'
                ? 'Generating…'
                : 'Copy Stripe portal link'}
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Customer ID
            </dt>
            <dd className="font-mono text-[var(--fs-ink-dim)]">
              {stripeCustomerId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Subscription ID
            </dt>
            <dd className="font-mono text-[var(--fs-ink-dim)]">
              {stripeSubscriptionId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Deposit invoice
            </dt>
            <dd className="font-mono text-[var(--fs-ink-dim)] truncate">
              {(project.deposit_invoice_id as string | null) ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.65rem] uppercase tracking-wide text-[var(--fs-ink-faint)]">
              Final invoice
            </dt>
            <dd className="font-mono text-[var(--fs-ink-dim)] truncate">
              {(project.final_invoice_id as string | null) ?? '—'}
            </dd>
          </div>
        </dl>
        {stripeCustomerId && (
          <p className="mt-3 text-[0.65rem] text-[var(--fs-ink-faint)]">
            <CheckCircle2 className="inline-block w-3 h-3 mr-1" /> Open the
            client&apos;s billing page in Stripe dashboard for manual actions
            (refunds, payment-method updates, invoice voiding).
          </p>
        )}
      </ShellCard>
    </div>
  );
}
