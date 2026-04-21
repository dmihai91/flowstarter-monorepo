-- Create AI audit logs table and drop legacy agent_memories

create table if not exists ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  username text,
  ip inet,
  user_agent text,
  route text,
  agent text,
  action text,
  project_id uuid,
  pipeline_id text,
  encrypted_payload text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_audit_logs_user_idx on ai_audit_logs (user_id, created_at desc);
create index if not exists ai_audit_logs_project_idx on ai_audit_logs (project_id, created_at desc);
create index if not exists ai_audit_logs_pipeline_idx on ai_audit_logs (pipeline_id, created_at desc);

-- Drop legacy memories table
drop table if exists agent_memories;


