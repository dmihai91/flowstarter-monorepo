'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { compactRelative } from '@/lib/format-utils';
import { TeamDashboardShell } from '../../components/TeamDashboardShell';

interface Inquiry {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company_name: string;
  website: string | null;
  role: string;
  industry: string;
  project_types: string[];
  project_type_other: string | null;
  budget_range: string;
  timeline: string;
  justification: string;
  referral_source: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  booking_link: string | null;
  rejection_reason: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  founder_ceo: 'Founder / CEO',
  cto: 'CTO',
  marketing_director: 'Marketing Director',
  product_manager: 'Product Manager',
  other: 'Other',
};
const BUDGET_LABEL: Record<string, string> = {
  '5-10k': '€5,000 – €10,000',
  '10-20k': '€10,000 – €20,000',
  '20-30k': '€20,000 – €30,000',
  '30k+': '€30,000+',
};
const TIMELINE_LABEL: Record<string, string> = {
  '1-2-months': '1–2 months',
  '2-4-months': '2–4 months',
  '4-6-months': '4–6 months',
  flexible: 'Flexible',
};
const PROJECT_TYPE_LABEL: Record<string, string> = {
  ai_integration: 'AI integration',
  custom_platform: 'Custom platform / SaaS',
  booking_system: 'Complex booking system',
  ecommerce_customization: 'E-commerce customisation',
  internal_tool: 'Internal tool / dashboard',
  membership: 'Membership / course platform',
  other: 'Other',
};
const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  completed: 'Completed',
  archived: 'Archived',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
        {label}
      </div>
      <div className="mt-1 text-sm text-[var(--ls-ink)]">{value || '—'}</div>
    </div>
  );
}

const DEFAULT_BOOKING_LINK =
  process.env.NEXT_PUBLIC_CONSULTATION_CAL_URL ||
  'https://calendly.com/flowstarter-app/discovery';

const REJECT_TEMPLATE = (name: string, projectTypes: string) => `Hi ${name},

Thanks for your interest in working with us on ${projectTypes}.

After reviewing your inquiry, we think the best next step is our Strategy Call (€100, fully credited toward your project if we move forward). This gives us a focused 45 minutes to dig into your specific needs and provide concrete recommendations.

For projects in your budget range, the Strategy Call format works better to make sure we provide actionable value from the first conversation.

Book your Strategy Call: https://flowstarter.net/#pricing

Looking forward to working together.

— The Flowstarter team`;

const APPROVE_DEFAULT_MESSAGE = (
  name: string,
  projectTypes: string
) => `Hi ${name},

Thanks for the detailed inquiry about ${projectTypes}. Your project sounds like exactly the kind of complex custom work we love to tackle at Flowstarter.

Let's set up a free 45-minute consultation to dive deeper into your requirements and explore how we can help.

To make our time together most valuable, it would help if you could share before the call:
- Any existing documentation, wireframes, or design ideas
- Examples of solutions you admire (even from different industries)
- Key constraints (technical, budget, timeline, integrations)

By the end of the call, you'll have clear next steps regardless of whether we work together.

Looking forward to the conversation.

— The Flowstarter team`;

export default function InquiryDetailPage() {
  const { t } = useTranslations();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ inquiry: Inquiry }>({
    queryKey: ['custom-inquiry', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/custom-inquiries/${id}`);
      if (!res.ok) throw new Error('Failed to load inquiry');
      return res.json();
    },
    enabled: !!id,
  });

  const inquiry = data?.inquiry;

  const [notes, setNotes] = useState<string>('');
  const [notesDirty, setNotesDirty] = useState(false);
  useEffect(() => {
    if (inquiry) {
      setNotes(inquiry.admin_notes ?? '');
      setNotesDirty(false);
    }
  }, [inquiry]);

  const saveNotes = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch(`/api/admin/custom-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: value }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      setNotesDirty(false);
      queryClient.invalidateQueries({ queryKey: ['custom-inquiry', id] });
    },
  });

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <TeamDashboardShell
      title={t('admin.nav.inquiries')}
      icon={<MessageSquare className="h-5 w-5" aria-hidden />}
    >
      <div className="mb-4">
        <Link
          href="/admin/dashboard/inquiries"
          className="inline-flex items-center gap-1 text-[13px] text-[var(--ls-ink-faint)] hover:text-[var(--ls-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to inquiries
        </Link>
      </div>

      {isLoading && (
        <div className="ls-card">
          <p className="text-sm text-[var(--ls-ink-faint)]">Loading inquiry…</p>
        </div>
      )}
      {error && (
        <div className="ls-card">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            Could not load this inquiry.
          </p>
        </div>
      )}
      {inquiry && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="ls-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ls-ink)]">
                  {inquiry.company_name}
                </h2>
                <p className="text-[13px] text-[var(--ls-ink-faint)]">
                  {inquiry.name} ·{' '}
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="text-[var(--ls-accent)] hover:underline"
                  >
                    {inquiry.email}
                  </a>{' '}
                  · Submitted {compactRelative(inquiry.created_at)}
                </p>
              </div>
              <span className="inline-flex rounded-full bg-[var(--ls-glass-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ls-ink)]">
                {STATUS_LABEL[inquiry.status] ?? inquiry.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role" value={ROLE_LABEL[inquiry.role]} />
              <Field label="Industry" value={inquiry.industry} />
              <Field
                label="Budget"
                value={BUDGET_LABEL[inquiry.budget_range]}
              />
              <Field
                label="Timeline"
                value={TIMELINE_LABEL[inquiry.timeline]}
              />
              <Field
                label="Website"
                value={
                  inquiry.website ? (
                    <a
                      href={inquiry.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--ls-accent)] hover:underline"
                    >
                      {inquiry.website}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
              <Field label="Referral" value={inquiry.referral_source ?? ''} />
              <div className="sm:col-span-2">
                <Field
                  label="Project types"
                  value={
                    <div className="flex flex-wrap gap-1.5">
                      {inquiry.project_types.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-[var(--ls-glass-bg)] px-2 py-0.5 text-[11px] text-[var(--ls-ink-dim)]"
                        >
                          {PROJECT_TYPE_LABEL[t] || t}
                        </span>
                      ))}
                      {inquiry.project_type_other && (
                        <span className="rounded-full bg-[var(--ls-glass-bg)] px-2 py-0.5 text-[11px] text-[var(--ls-ink-dim)]">
                          Other: {inquiry.project_type_other}
                        </span>
                      )}
                    </div>
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Justification"
                  value={
                    <p className="whitespace-pre-wrap text-[var(--ls-ink-dim)]">
                      {inquiry.justification}
                    </p>
                  }
                />
              </div>
            </div>

            {inquiry.booking_link && (
              <div className="mt-5 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
                  Sent booking link
                </div>
                <a
                  href={inquiry.booking_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--ls-accent)] hover:underline"
                >
                  {inquiry.booking_link}
                </a>
              </div>
            )}
            {inquiry.rejection_reason && (
              <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
                  Rejection reason
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ls-ink-dim)]">
                  {inquiry.rejection_reason}
                </p>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <div className="ls-card">
              <h3 className="text-sm font-semibold text-[var(--ls-ink)]">
                Triage
              </h3>
              <p className="mt-1 text-[12px] text-[var(--ls-ink-faint)]">
                Pick a path. Both send the prospect an email and update the
                status.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setApproveOpen(true)}
                  disabled={inquiry.status !== 'pending_review'}
                  className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve & send booking link
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={inquiry.status !== 'pending_review'}
                  className="h-10 w-full rounded-lg border border-[var(--ls-rule)] bg-transparent text-sm font-semibold text-[var(--ls-ink)] transition-colors hover:border-[var(--ls-ink)] disabled:opacity-50"
                >
                  Reject with redirect
                </button>
              </div>
              {inquiry.reviewed_at && (
                <p className="mt-3 text-[11px] text-[var(--ls-ink-faint)]">
                  Reviewed {compactRelative(inquiry.reviewed_at)}
                  {inquiry.reviewed_by ? ` by ${inquiry.reviewed_by}` : ''}
                </p>
              )}
            </div>

            <div className="ls-card">
              <h3 className="text-sm font-semibold text-[var(--ls-ink)]">
                Admin notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesDirty(true);
                }}
                onBlur={() => {
                  if (notesDirty) saveNotes.mutate(notes);
                }}
                rows={6}
                placeholder="Private notes — not sent to the prospect."
                className="mt-2 w-full rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-2 text-sm text-[var(--ls-ink)] outline-none"
              />
              <p className="mt-1 text-[11px] text-[var(--ls-ink-faint)]">
                {saveNotes.isPending
                  ? 'Saving…'
                  : notesDirty
                  ? 'Unsaved changes'
                  : 'Saved'}
              </p>
            </div>
          </section>
        </div>
      )}

      {inquiry && approveOpen && (
        <ApproveModal
          inquiry={inquiry}
          onClose={() => setApproveOpen(false)}
          onDone={() => {
            setApproveOpen(false);
            queryClient.invalidateQueries({
              queryKey: ['custom-inquiry', id],
            });
          }}
        />
      )}
      {inquiry && rejectOpen && (
        <RejectModal
          inquiry={inquiry}
          onClose={() => setRejectOpen(false)}
          onDone={() => {
            setRejectOpen(false);
            queryClient.invalidateQueries({
              queryKey: ['custom-inquiry', id],
            });
          }}
        />
      )}
    </TeamDashboardShell>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ls-card w-full max-w-xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--ls-ink)]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ls-ink-faint)] hover:text-[var(--ls-ink)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApproveModal({
  inquiry,
  onClose,
  onDone,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onDone: () => void;
}) {
  const projectTypes = inquiry.project_types
    .map((t) => PROJECT_TYPE_LABEL[t] || t)
    .join(', ');
  const [bookingLink, setBookingLink] = useState(DEFAULT_BOOKING_LINK);
  const [message, setMessage] = useState(
    APPROVE_DEFAULT_MESSAGE(inquiry.name.split(/\s+/)[0], projectTypes)
  );
  const [error, setError] = useState('');

  const approve = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/custom-inquiries/${inquiry.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_link: bookingLink, message }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => onDone(),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <Modal title="Approve & send booking link" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
          Booking link
          <input
            value={bookingLink}
            onChange={(e) => setBookingLink(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-2 text-sm text-[var(--ls-ink)] outline-none"
          />
        </label>
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
          Email message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
            className="mt-1 w-full rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-2 text-sm text-[var(--ls-ink)] outline-none"
          />
        </label>
        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--ls-rule)] px-4 py-2 text-sm text-[var(--ls-ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => approve.mutate()}
            disabled={approve.isPending || !bookingLink.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {approve.isPending ? 'Sending…' : 'Send approval'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({
  inquiry,
  onClose,
  onDone,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onDone: () => void;
}) {
  const projectTypes = inquiry.project_types
    .map((t) => PROJECT_TYPE_LABEL[t] || t)
    .join(', ');
  const [message, setMessage] = useState(
    REJECT_TEMPLATE(inquiry.name.split(/\s+/)[0], projectTypes)
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const reject = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/admin/custom-inquiries/${inquiry.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, rejection_reason: reason }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => onDone(),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <Modal title="Reject with redirect to Strategy Call" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
          Internal rejection reason (private, for analytics)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. budget too low, scope unclear, not a fit"
            className="mt-1 w-full rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-2 text-sm text-[var(--ls-ink)] outline-none"
          />
        </label>
        <label className="text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
          Email message to prospect
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="mt-1 w-full rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] p-2 text-sm text-[var(--ls-ink)] outline-none"
          />
        </label>
        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--ls-rule)] px-4 py-2 text-sm text-[var(--ls-ink)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => reject.mutate()}
            disabled={reject.isPending}
            className="rounded-lg border border-[var(--ls-rule)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--ls-ink)] hover:border-[var(--ls-ink)] disabled:opacity-50"
          >
            {reject.isPending ? 'Sending…' : 'Send rejection'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
