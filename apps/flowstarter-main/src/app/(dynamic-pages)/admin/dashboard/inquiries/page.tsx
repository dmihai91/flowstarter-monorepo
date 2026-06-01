'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { compactRelative } from '@/lib/format-utils';
import { TeamDashboardShell } from '../components/TeamDashboardShell';

interface InquirySummary {
  id: string;
  created_at: string;
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
  referral_source: string | null;
  status: string;
  reviewed_at: string | null;
  booking_link: string | null;
}

interface InquiriesResponse {
  inquiries: InquirySummary[];
  total: number;
  page: number;
  pageSize: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  completed: 'Completed',
  archived: 'Archived',
};

const STATUS_CLASS: Record<string, string> = {
  pending_review: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  scheduled: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  completed: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  archived: 'bg-[var(--ls-glass-bg)] text-[var(--ls-ink-faint)]',
};

const BUDGET_LABEL: Record<string, string> = {
  '5-10k': '€5k–€10k',
  '10-20k': '€10k–€20k',
  '20-30k': '€20k–€30k',
  '30k+': '€30k+',
};

const PROJECT_TYPE_LABEL: Record<string, string> = {
  ai_integration: 'AI integration',
  custom_platform: 'Custom platform',
  booking_system: 'Booking system',
  ecommerce_customization: 'E-commerce',
  internal_tool: 'Internal tool',
  membership: 'Membership',
  other: 'Other',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        STATUS_CLASS[status] ?? STATUS_CLASS.archived
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function InquiriesPage() {
  const { t } = useTranslations();
  const [status, setStatus] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const queryString = new URLSearchParams();
  if (status) queryString.set('status', status);
  if (budget) queryString.set('budget', budget);
  if (search) queryString.set('q', search);
  queryString.set('page', String(page));

  const { data, isLoading, error } = useQuery<InquiriesResponse>({
    queryKey: ['custom-inquiries', status, budget, search, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/custom-inquiries?${queryString.toString()}`
      );
      if (!res.ok) throw new Error('Failed to load inquiries');
      return res.json();
    },
  });

  const inquiries = data?.inquiries ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pendingCount = inquiries.filter(
    (i) => i.status === 'pending_review'
  ).length;

  return (
    <TeamDashboardShell
      title={t('admin.nav.inquiries')}
      icon={<MessageSquare className="h-5 w-5" aria-hidden />}
    >
      <section className="ls-card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search company or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 flex-1 min-w-[200px] rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-3 text-sm text-[var(--ls-ink)] outline-none"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-3 text-sm text-[var(--ls-ink)]"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-[var(--ls-rule)] bg-[var(--ls-glass-bg)] px-3 text-sm text-[var(--ls-ink)]"
          >
            <option value="">All budgets</option>
            {Object.entries(BUDGET_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <p className="text-sm text-[var(--ls-ink-faint)]">
            Loading inquiries…
          </p>
        )}
        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            Could not load inquiries.
          </p>
        )}
        {!isLoading && !error && inquiries.length === 0 && (
          <p className="text-sm text-[var(--ls-ink-faint)]">
            No inquiries match the current filters.
          </p>
        )}

        {inquiries.length > 0 && (
          <>
            <p className="mb-4 text-[13px] text-[var(--ls-ink-faint)]">
              {total} inquir{total === 1 ? 'y' : 'ies'} · {pendingCount} pending
              review on this page
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--ls-rule)] text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Budget</th>
                    <th className="py-2 pr-4 font-medium">Project types</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((i) => {
                    const types = i.project_types
                      .map((t) => PROJECT_TYPE_LABEL[t] || t)
                      .join(', ');
                    const truncated =
                      types.length > 60 ? `${types.slice(0, 57)}…` : types;
                    return (
                      <tr
                        key={i.id}
                        className="border-b border-[var(--ls-rule)]/60 align-top"
                      >
                        <td className="py-3 pr-4 whitespace-nowrap text-[var(--ls-ink-faint)]">
                          {compactRelative(i.created_at)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-[var(--ls-ink)]">
                            {i.company_name}
                          </div>
                          <div className="text-[12px] text-[var(--ls-ink-faint)]">
                            {i.name} ·{' '}
                            <a
                              href={`mailto:${i.email}`}
                              className="text-[var(--ls-accent)] hover:underline"
                            >
                              {i.email}
                            </a>
                          </div>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {BUDGET_LABEL[i.budget_range] ?? i.budget_range}
                        </td>
                        <td className="py-3 pr-4 text-[var(--ls-ink-dim)]">
                          {truncated}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={i.status} />
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <Link
                            href={`/admin/dashboard/inquiries/${i.id}`}
                            className="text-[12px] font-medium text-[var(--ls-accent)] hover:underline"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-3 text-[12px]">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-[var(--ls-rule)] px-2 py-1 disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-[var(--ls-ink-faint)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-[var(--ls-rule)] px-2 py-1 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </TeamDashboardShell>
  );
}
