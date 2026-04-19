'use client';
import { useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { GlassCard } from '@flowstarter/flow-design-system';
import { useClientRequests } from '@/lib/client-requests/useClientRequests';
import { useClientRequestsRealtime } from '@/lib/client-requests/useClientRequestsRealtime';
import { RequestCard } from './RequestCard';

const STATUS_TABS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'all',         label: 'All' },
  { value: 'resolved',    label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest' },
  { value: 'priority', label: 'Priority' },
];

export function ClientRequestsList() {
  const [status, setStatus] = useState('pending');
  const [sort,   setSort]   = useState('newest');
  const [search, setSearch] = useState('');

  useClientRequestsRealtime();

  const { data, isLoading } = useClientRequests({ status, sort, search });
  const requests = data?.requests ?? [];

  return (
    <section id="client-requests-list" className="mb-8">
      <GlassCard noHover>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--fs-ink)]">
            Client Requests
          </h2>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {/* Status chips */}
          <div className="flex items-center gap-1 bg-[var(--fs-rule)]/40 rounded-xl p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  status === tab.value
                    ? 'bg-[var(--fs-bg-elevated)] text-[var(--fs-ink)] shadow-sm'
                    : 'text-[var(--fs-ink-faint)] hover:text-[var(--fs-ink-dim)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--fs-accent-ring)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--fs-ink-faint)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink-dim)] placeholder:text-[var(--fs-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--fs-accent-ring)] w-48"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[var(--fs-radius-lg)] border border-[var(--fs-rule)] p-4 animate-pulse"
                style={{ background: 'var(--fs-bg-elevated)' }}
              >
                <div className="flex gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--fs-rule)] mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-[var(--fs-rule)] rounded" />
                    <div className="h-3 w-32 bg-[var(--fs-rule)]/60 rounded" />
                    <div className="h-3 w-full bg-[var(--fs-rule)]/60 rounded" />
                    <div className="h-3 w-3/4 bg-[var(--fs-rule)]/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]">
              <Inbox className="w-8 h-8 text-[var(--fs-ink-faint)]" />
            </div>
            {status === 'resolved' ? (
              <>
                <h3 className="text-lg font-semibold text-[var(--fs-ink)] mb-2">
                  You&rsquo;re all caught up
                </h3>
                <p className="text-sm text-[var(--fs-ink-faint)]">
                  No resolved requests in this view.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[var(--fs-ink)] mb-2">
                  No client requests yet
                </h3>
                <p className="text-sm text-[var(--fs-ink-faint)] max-w-sm mx-auto">
                  When clients hit the limits of their editor, requests will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </GlassCard>
    </section>
  );
}
