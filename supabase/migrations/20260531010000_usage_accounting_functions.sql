-- Atomic usage-counter mutators for editor enforcement (master doc §5).
--
-- supabase-js can't express `col = col + n` in .update(), so the editor calls
-- these via rpc(). SECURITY INVOKER (default): the editor uses the service
-- role (bypasses RLS); anon/authenticated must NOT be able to bump counters,
-- so execute is revoked from them.
--
-- Idempotent: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION increment_workspace_sessions_used(p_workspace_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE workspaces
  SET subscription_sessions_used_this_month = subscription_sessions_used_this_month + 1
  WHERE id = p_workspace_id;
$$;

CREATE OR REPLACE FUNCTION add_workspace_ai_cost_usd(p_workspace_id uuid, p_usd numeric)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE workspaces
  SET subscription_ai_cost_usd_this_month =
        subscription_ai_cost_usd_this_month + GREATEST(p_usd, 0)
  WHERE id = p_workspace_id;
$$;

REVOKE EXECUTE ON FUNCTION increment_workspace_sessions_used(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION add_workspace_ai_cost_usd(uuid, numeric) FROM public, anon, authenticated;
