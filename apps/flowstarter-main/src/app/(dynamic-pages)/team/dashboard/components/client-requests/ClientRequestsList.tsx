'use client';
import { useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import { useClientRequests } from '@/lib/client-requests/useClientRequests';
import { useClientRequestsRealtime } from '@/lib/client-requests/useClientRequestsRealtime';
import { RequestCard } from './RequestCard';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'all', label: 'All' },
  { value: 'resolved', label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'priority', label: 'Priority' },
];

export function ClientRequestsList() {
  const [status, setStatus] = useState('pending');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');

  useClientRequestsRealtime();

  const { data, isLoading } = useClientRequests({ status, sort, search });
  const requests = data?.requests ?? [];

  return (
    <section id="client-requests-list" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Client Requests
        </h2>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status chips */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                status === tab.value
                  ? 'bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/70 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/70 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/40 w-48"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-white/[0.03] p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-white/10 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-white/[0.06] rounded" />
                  <div className="h-3 w-full bg-gray-100 dark:bg-white/[0.06] rounded" />
                  <div className="h-3 w-3/4 bg-gray-100 dark:bg-white/[0.06] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.06] bg-white/95 dark:bg-white/[0.03] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/55 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
            <Inbox className="w-8 h-8 text-gray-400 dark:text-white/30" />
          </div>
          {status === 'resolved' ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                You&rsquo;re all caught up
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50">
                No resolved requests in this view.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No client requests yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50 max-w-sm mx-auto">
                When clients hit the limits of their editor, requests will
                appear here.
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
    </section>
  );
}
