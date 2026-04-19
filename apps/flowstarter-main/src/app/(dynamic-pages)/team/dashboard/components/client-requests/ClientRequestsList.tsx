'use client';
import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { ListShell, FilterTabs, SortSelect, SearchInput } from '../ListShell';
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

  const emptyTitle = status === 'resolved'
    ? "You're all caught up"
    : 'No client requests yet';

  const emptyDescription = status === 'resolved'
    ? 'No resolved requests in this view.'
    : 'When clients hit the limits of their editor, requests will appear here.';

  return (
    <ListShell
      id="client-requests-list"
      title="Client Requests"
      count={!isLoading && requests.length > 0 ? requests.length : undefined}
      loading={isLoading}
      empty={!isLoading && requests.length === 0}
      emptyIcon={<Inbox className="w-8 h-8" />}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      filters={
        <>
          {/* Tabs — full width on mobile, scrollable */}
          <div className="w-full">
            <FilterTabs tabs={STATUS_TABS} value={status} onChange={setStatus} />
          </div>
          {/* Sort + search on same row below */}
          <div className="flex items-center gap-2 w-full">
            <SortSelect options={SORT_OPTIONS} value={sort} onChange={setSort} />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search requests…"
            />
          </div>
        </>
      }
    >
      <div className="space-y-3">
        {requests.map((req) => (
          <RequestCard key={req.id} request={req} />
        ))}
      </div>
    </ListShell>
  );
}
