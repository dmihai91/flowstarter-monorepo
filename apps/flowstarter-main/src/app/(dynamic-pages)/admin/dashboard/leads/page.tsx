'use client';

import { useQuery } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { compactRelative } from '@/lib/format-utils';
import { TeamDashboardShell } from '../components/TeamDashboardShell';

interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  business_name: string | null;
  industry: string | null;
  description: string;
  selected_tier: string;
  subscription: string | null;
  source: string | null;
  deposit_status: 'none' | 'paid' | 'refunded';
  deposit_amount_eur: number | null;
  deposit_paid_at: string | null;
  project_id: string | null;
}

function DepositBadge({
  status,
  amount,
}: {
  status: string;
  amount: number | null;
}) {
  // Same chip recipe as the pipeline board and the project tabs.
  const map: Record<string, string> = {
    paid: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    refunded:
      'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    none: 'border-[var(--ls-rule)] bg-transparent text-[var(--ls-ink-dim)]',
  };
  const label =
    status === 'paid'
      ? `Paid${amount ? ` · €${amount}` : ''}`
      : status === 'refunded'
      ? 'Refunded'
      : 'No deposit';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 ${
        map[status] ?? map.none
      }`}
    >
      {label}
    </span>
  );
}

export default function LeadsPage() {
  const { t } = useTranslations();
  const { data, isLoading, error } = useQuery<{ leads: Lead[] }>({
    queryKey: ['discovery-leads'],
    queryFn: async () => {
      const res = await fetch('/api/admin/discovery-leads');
      if (!res.ok) throw new Error('Failed to load leads');
      return res.json();
    },
  });

  const leads = data?.leads ?? [];
  const paidCount = leads.filter((l) => l.deposit_status === 'paid').length;

  return (
    <TeamDashboardShell
      title={t('admin.nav.leads')}
      icon={<Inbox className="h-5 w-5" aria-hidden />}
    >
      <section className="ls-card">
        {isLoading && (
          <p className="text-sm text-[var(--ls-ink-faint)]">Loading leads…</p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not load leads.
          </p>
        )}
        {!isLoading && !error && leads.length === 0 && (
          <p className="text-sm text-[var(--ls-ink-faint)]">
            No discovery leads yet.
          </p>
        )}

        {leads.length > 0 && (
          <>
            <p className="mb-4 text-[13px] text-[var(--ls-ink-faint)]">
              {leads.length} lead{leads.length === 1 ? '' : 's'} · {paidCount}{' '}
              with a paid deposit
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--ls-rule)] text-[11px] uppercase tracking-[0.12em] text-[var(--ls-ink-faint)]">
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Business</th>
                    <th className="py-2 pr-4 font-medium">Build</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Deposit</th>
                    <th className="py-2 pr-4 font-medium">Project</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-[var(--ls-rule)]/60 align-top"
                    >
                      <td className="py-3 pr-4 whitespace-nowrap text-[var(--ls-ink-faint)]">
                        {compactRelative(l.created_at)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-[var(--ls-ink)]">
                          {l.full_name}
                        </div>
                        <a
                          href={`mailto:${l.email}`}
                          className="text-[12px] text-[var(--ls-accent)] hover:underline"
                        >
                          {l.email}
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-[var(--ls-ink)]">
                          {l.business_name || '–'}
                        </div>
                        <div className="text-[12px] text-[var(--ls-ink-faint)]">
                          {l.industry || ''}
                        </div>
                      </td>
                      <td className="py-3 pr-4 capitalize">
                        {l.selected_tier}
                      </td>
                      <td className="py-3 pr-4 capitalize">
                        {l.subscription || '–'}
                      </td>
                      <td className="py-3 pr-4">
                        <DepositBadge
                          status={l.deposit_status}
                          amount={l.deposit_amount_eur}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {l.project_id ? (
                          <a
                            href={`/admin/dashboard/projects/${l.project_id}`}
                            className="text-[12px] font-medium text-[var(--ls-accent)] hover:underline"
                          >
                            View project →
                          </a>
                        ) : (
                          <span className="text-[12px] text-[var(--ls-ink-faint)]">
                            –
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </TeamDashboardShell>
  );
}
