'use client';

/**
 * Changes tab: what the client asked for after launch, priced by us.
 *
 * Each request shows the classifier's labels and the rule table's suggested
 * price, pre-filled into a quote form an operator edits before sending. The
 * client accepts and pays in their editor; the request comes back here as
 * paid, and the operator marks it done when the work has shipped.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { BadgeEuro, Check, XCircle } from 'lucide-react';
import { ShellCard } from '../../../components/TeamDashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { compactRelative } from '@/lib/format-utils';
import {
  useChangeRequests,
  useQuoteChangeRequest,
  useSetChangeRequestStatus,
  type ChangeRequestView,
} from '@/hooks/useChangeRequests';
import type { Project } from './form-helpers';

const NEUTRAL_TONE =
  'border-[var(--fs-rule)] bg-transparent text-[var(--fs-ink-dim)]';
const STATUS_TONE: Record<string, string> = {
  requested: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  quoted:
    'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  accepted:
    'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  paid: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  done: NEUTRAL_TONE,
  declined: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
};
const STATUS_LABEL: Record<string, string> = {
  requested: 'Needs a quote',
  quoted: 'Quoted, waiting on the client',
  accepted: 'Accepted, in checkout',
  paid: 'Paid, ready to build',
  done: 'Done',
  declined: 'Declined',
};

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}

function RequestCard({
  request,
  projectId,
}: {
  request: ChangeRequestView;
  projectId: string;
}) {
  const quote = useQuoteChangeRequest(projectId);
  const setStatus = useSetChangeRequestStatus(projectId);
  const [amount, setAmount] = useState(() =>
    ((request.quoteMinor ?? request.suggestedQuoteMinor ?? 0) / 100).toFixed(2)
  );
  const [note, setNote] = useState(request.quoteNote ?? '');
  const busy = quote.isPending || setStatus.isPending;
  const canQuote =
    request.status === 'requested' || request.status === 'quoted';

  const onQuote = async () => {
    const minor = Math.round(Number(amount) * 100);
    if (!Number.isFinite(minor) || minor < 0) {
      toast.error('Enter an amount');
      return;
    }
    try {
      await quote.mutateAsync({
        changeId: request.id,
        amountMinor: minor,
        note,
      });
      toast.success('Quote sent. The client sees it in their editor.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the quote');
    }
  };
  const onStatus = async (status: 'declined' | 'done') => {
    try {
      await setStatus.mutateAsync({ changeId: request.id, status });
      toast.success(status === 'done' ? 'Marked done' : 'Declined');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update');
    }
  };

  return (
    <li
      data-testid="change-request-card"
      className="rounded-lg border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)] p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap text-sm text-[var(--fs-ink)]">
            {request.request}
          </p>
          <p className="mt-1 text-[11px] text-[var(--fs-ink-faint)]">
            {compactRelative(request.createdAt)} ·{' '}
            {request.matchedRules.length > 0
              ? request.matchedRules.join(', ')
              : request.classification}
            {typeof request.suggestedQuoteMinor === 'number' && (
              <>
                {' '}
                · suggested{' '}
                {formatMoney(request.suggestedQuoteMinor, request.currency)}
              </>
            )}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 ${
            STATUS_TONE[request.status] ?? NEUTRAL_TONE
          }`}
        >
          {STATUS_LABEL[request.status] ?? request.status}
        </span>
      </div>

      {request.quoteMinor !== null && !canQuote && (
        <p className="mt-2 text-xs text-[var(--fs-ink-dim)]">
          Quoted {formatMoney(request.quoteMinor, request.currency)}
          {request.quoteNote ? ` · ${request.quoteNote}` : ''}
          {request.paidAt ? ` · paid ${compactRelative(request.paidAt)}` : ''}
        </p>
      )}

      {canQuote && (
        <div className="mt-3 grid gap-2 border-t border-[var(--fs-rule)] pt-3 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-end">
          <div>
            <Label htmlFor={`quote-amount-${request.id}`}>
              Quote ({request.currency.toUpperCase()})
            </Label>
            <Input
              id={`quote-amount-${request.id}`}
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor={`quote-note-${request.id}`}>
              What the client will read
            </Label>
            <Textarea
              id={`quote-note-${request.id}`}
              rows={1}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Includes a new workshops page with its own booking calendar; live within 5 working days of payment."
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onQuote} disabled={busy}>
              <BadgeEuro className="h-4 w-4" />
              {request.status === 'quoted' ? 'Re-quote' : 'Send quote'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStatus('declined')}
              disabled={busy}
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {request.status === 'paid' && (
        <div className="mt-3 flex justify-end border-t border-[var(--fs-rule)] pt-3">
          <Button size="sm" onClick={() => onStatus('done')} disabled={busy}>
            <Check className="h-4 w-4" />
            Mark done
          </Button>
        </div>
      )}
    </li>
  );
}

export function ChangesTab({ project }: { project: Project }) {
  const { data, isLoading, error } = useChangeRequests(project.id);

  if (error) {
    return (
      <ShellCard>
        <p className="text-sm text-red-500">
          {error instanceof Error
            ? error.message
            : 'Could not load change requests.'}
        </p>
      </ShellCard>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="h-28 animate-pulse rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-glass-bg)]" />
    );
  }

  const open = data.requests.filter((r) => r.status === 'requested').length;
  return (
    <ShellCard>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--fs-ink-dim)]">
          Change requests
        </h3>
        {open > 0 && (
          <span className="text-xs text-[var(--fs-ink-faint)]">
            {open} waiting for a quote
          </span>
        )}
      </div>
      {data.requests.length === 0 ? (
        <p className="text-xs text-[var(--fs-ink-faint)]">
          Nothing asked for yet. Requests the client files from the
          editor&apos;s &ldquo;Bigger changes&rdquo; tab land here for a quote.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              projectId={project.id}
            />
          ))}
        </ul>
      )}
    </ShellCard>
  );
}
