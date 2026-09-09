-- A client asking for a change the editor cannot make (layout, new pages,
-- integrations, colors) files a `change_request` into the same thread the
-- concierge conversation already lives in. Inbound like a reply, but it must
-- not close an open ask and it waits on the operator, so it is its own kind.
alter table public.project_messages
  drop constraint if exists project_messages_kind_check;
alter table public.project_messages
  add constraint project_messages_kind_check
  check (kind in (
    'asset_request',
    'clarification',
    'reminder',
    'client_reply',
    'change_request'
  ));
