-- Per-tenant Cal.com booking URL, taken from intake (or set later on the
-- client booking page). The build/preview injectors read this column so each
-- workspace embeds its own calendar, never a shared Flowstarter one.
alter table public.workspaces
  add column if not exists cal_com_url text;

comment on column public.workspaces.cal_com_url is
  'Tenant Cal.com link or handle (e.g. https://cal.com/acme/intro or acme/intro). Null when the client has not provided one.';
