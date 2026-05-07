-- Cleanup of orphan tables after the May 2026 master-doc realignment.
--
-- Drops:
--   1. editor_workspaces — Daytona-tied per-client sandbox state. Master
--      doc §3-4 replaces Daytona with multi-tenant subdomain routing on
--      Hetzner. Workspace state now lives in `client_sites` + `hosting_servers`
--      + the editor session/milestone tables added in
--      20260507093222_master_decisions_alignment.
--   2. example_sites — public-dashboard "see what we build" gallery. The
--      client dashboard route was removed in the dashboard rip; this table
--      had no consumers in src after that.
--
-- Both verified via grep before this migration was authored.

DROP TABLE IF EXISTS editor_workspaces CASCADE;
DROP TABLE IF EXISTS example_sites CASCADE;
