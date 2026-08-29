-- Server-only tables — explicit grants for consistency.
--
-- These tables have row level security enabled but no policies. With RLS on
-- and zero policies, every row is already invisible to anon/authenticated —
-- an absent policy is a deny, not an open door. But that deny is implicit:
-- it depends on nobody ever adding a policy without also thinking through
-- the grants, and it leaves the actual PostgreSQL table privileges (which
-- default from `alter default privileges` / historical `grant all`) as
-- whatever they happened to be when the table was created.
--
-- This makes the deny explicit at the grant level too, the same pattern
-- already used for llm_usage / flowstarter_agent_jobs /
-- flowstarter_project_artifacts in 20260829090100_concierge_rls_policies.sql:
-- revoke everything from anon and authenticated, grant everything to
-- service_role. A future policy added to one of these tables then has to be
-- paired with an explicit grant to do anything — it cannot ride on a grant
-- nobody meant to leave open.
--
-- Guarded with to_regclass so this is a no-op (not a failure) if a table is
-- absent in a given environment.

do $$
declare
  t text;
  server_only_tables text[] := array[
    'demo_generation_costs',
    'demo_edit_counters',
    'discovery_leads',
    'custom_inquiries',
    'leads',
    'contact_submissions',
    'ai_audit_logs',
    'hosting_servers',
    'deployments',
    'editor_sessions',
    'setup_payment_milestones',
    'vault_encrypted_secrets',
    'commerce_products',
    'profiles'
  ];
begin
  foreach t in array server_only_tables loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke all on table public.%I from anon, authenticated', t);
      execute format('grant all on table public.%I to service_role', t);
    end if;
  end loop;
end
$$;
