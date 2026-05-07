-- Profiles — Clerk user mirror.
-- Each row is a one-to-one mirror of a Clerk user, keyed by clerk_user_id.
-- Other tables FK to profiles when they need an owner; the source of truth
-- for auth identity is Clerk, this table just makes it joinable.
--
-- Matches the existing prod schema (project ref avptvzherjxymmbtbbbr).

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles (clerk_user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Service role manages this table; user-side access goes through the API.
-- No public policies on purpose — keeps the admin model explicit.
