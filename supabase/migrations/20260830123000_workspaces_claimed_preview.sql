-- Claiming a funnel preview: the conversion from anonymous demo to owned project.
--
-- The discovery wizard generates a preview against a throwaway demo id and
-- persists nothing, while the deposit half of the product requires a workspace
-- with a membership, artifacts and a quote. `claimed_preview_id` is the link
-- between the two, and the reason the conversion can be retried safely: a
-- second claim of the same preview collides on the index below and adopts the
-- workspace the first one made instead of creating a duplicate project.
--
-- Partial, because every workspace created any other way (operator draft, team
-- draft, booking deposit) legitimately has no preview behind it, and a plain
-- unique index would let only one of them exist.

alter table public.workspaces
  add column if not exists claimed_preview_id text;

comment on column public.workspaces.claimed_preview_id is
  'Discovery-wizard preview (demo) id this workspace was claimed from. Null for workspaces created by an operator or a booking deposit. Unique when set, so re-claiming the same preview is idempotent.';

create unique index if not exists workspaces_claimed_preview_id_key
  on public.workspaces (claimed_preview_id)
  where claimed_preview_id is not null;
