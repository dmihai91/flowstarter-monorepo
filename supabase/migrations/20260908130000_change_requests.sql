-- Change requests with a price on them.
--
-- The editor's "Bigger changes" box files a client's ask into the project
-- thread (project_messages, kind change_request). That row is a message: it
-- has no amount, no accept, no payment. This table is the request as a piece
-- of work with a quote attached, moving through
--
--   requested -> quoted -> accepted -> paid -> done
--                      \-> declined            (client or operator)
--
-- The operator writes the quote; the client accepts it and pays through a
-- Stripe Checkout session whose metadata carries the request id; the webhook
-- marks it paid. A quote of zero is accepted without Stripe: nothing to pay.
--
-- Clients read their own workspace's rows. Only the service role writes.

create table if not exists public.flowstarter_change_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  message_id uuid references public.project_messages(id) on delete set null,
  request text not null check (char_length(request) between 10 and 2000),
  classification text not null default 'structural',
  matched_rules jsonb not null default '[]'::jsonb,
  status text not null default 'requested'
    check (status in ('requested', 'quoted', 'accepted', 'paid', 'declined', 'done')),
  quote_minor integer check (quote_minor is null or (quote_minor >= 0 and quote_minor <= 10000000)),
  currency text not null default 'eur',
  quote_note text,
  quoted_by text,
  quoted_at timestamptz,
  responded_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  completed_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flowstarter_change_requests_workspace_created_idx
  on public.flowstarter_change_requests (workspace_id, created_at desc);

create index if not exists flowstarter_change_requests_open_idx
  on public.flowstarter_change_requests (status, created_at desc)
  where status in ('requested', 'quoted', 'accepted', 'paid');

create unique index if not exists flowstarter_change_requests_checkout_idx
  on public.flowstarter_change_requests (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

alter table public.flowstarter_change_requests enable row level security;

drop policy if exists change_requests_select_members on public.flowstarter_change_requests;
create policy change_requests_select_members
  on public.flowstarter_change_requests for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on table public.flowstarter_change_requests from anon, authenticated;
grant select on table public.flowstarter_change_requests to authenticated;
grant all on table public.flowstarter_change_requests to service_role;

comment on table public.flowstarter_change_requests is
  'A client change request as priced work: quoted by an operator, accepted and paid by the client via Stripe Checkout, marked done by the team.';
