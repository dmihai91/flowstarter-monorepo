-- ─── Client replies as citable build evidence ──────────────────────────────
-- A clarification the client answers ("we have been trading since 2009, and we
-- do not do commercial work") is exactly the kind of fact the honesty pass
-- needs to cite. It is worthless to the generator unless it reaches the corpus
-- with a source id, so every reply is projected into a ScrapedTextDocument and
-- appended here.
--
-- This is a column of its own rather than a key inside `intake_payload`
-- because `savePreviewArtifacts` upserts `intake_payload` wholesale on every
-- preview regeneration. A regenerated preview must not silently delete the
-- answers the client already gave us. Supabase's upsert only writes the
-- columns present in its payload, so an unlisted column survives.
--
-- Shape: a JSON array of ScrapedTextDocument
-- (packages/agentic-codegen/src/flowstarter/types.ts), each with
-- sourceId = 'client_reply:<project_messages.id>'.

alter table public.flowstarter_project_artifacts
  add column if not exists client_reply_corpus jsonb not null default '[]'::jsonb;

-- The table is server-only (grants revoked from anon/authenticated in
-- 20260829090100); the new column inherits that. No policy is needed and none
-- is added: the absence of a grant is the deny.
