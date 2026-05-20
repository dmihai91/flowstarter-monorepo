-- Editor source-repo binding for the single-image / per-workspace
-- process model (docs/EDITOR_DEPLOYMENT.md).
--
-- The router clones `editor_repo_url` (branch `editor_repo_ref`) into
-- /workspaces/<slug> on the editor host; the spawned editor process
-- is pinned to that directory as its `cwd`. This is the EDITABLE
-- source of truth, distinct from `site_directory` (the DEPLOYED path
-- written by the deploy-agent under /var/www/sites/<slug>).
--
-- Idempotent (ADD COLUMN IF NOT EXISTS); safe to run on a populated
-- table — existing rows get NULL editor_repo_url and the 'main' default.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS editor_repo_url TEXT,
  ADD COLUMN IF NOT EXISTS editor_repo_ref TEXT NOT NULL DEFAULT 'main';

COMMENT ON COLUMN public.workspaces.editor_repo_url IS
  'Git URL (ssh or https) of this workspace''s editable source repo. The editor host clones it into /workspaces/<slug>; the editor process opens that directory as its cwd. NULL means no repo bound yet.';

COMMENT ON COLUMN public.workspaces.editor_repo_ref IS
  'Branch / tag / ref the editor checks out from editor_repo_url. Defaults to main.';

-- Help admin queries that ask "which workspaces have a source repo".
CREATE INDEX IF NOT EXISTS workspaces_editor_repo_url_idx
  ON public.workspaces (editor_repo_url)
  WHERE editor_repo_url IS NOT NULL;
