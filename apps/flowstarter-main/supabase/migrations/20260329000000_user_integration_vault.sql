-- User Integration Vault: encrypted secret storage for client OAuth tokens and API keys
-- Secrets (access_token, refresh_token, api_key) are stored in pgsodium-backed vault.secrets
-- Only non-sensitive metadata is kept in user_integrations.config

-- Ensure vault extension is enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ─── Helper: store a user-level integration secret ───────────────────────────
-- Inserts or updates an encrypted secret in vault.secrets.
-- Naming convention: user_{user_id}_{integration_id}_{key_name}
-- Returns the UUID that should be stored as a reference in config.
CREATE OR REPLACE FUNCTION store_user_secret(
  p_user_id      TEXT,
  p_integration_id TEXT,
  p_key_name     TEXT,
  p_value        TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_name TEXT;
  v_secret_id   UUID;
BEGIN
  v_secret_name := 'user_' || p_user_id || '_' || p_integration_id || '_' || p_key_name;

  -- Update existing secret if it already exists
  SELECT id INTO v_secret_id
  FROM vault.decrypted_secrets
  WHERE name = v_secret_name;

  IF v_secret_id IS NOT NULL THEN
    PERFORM vault.update_secret(
      v_secret_id,
      p_value,
      v_secret_name,
      'Integration secret for user ' || p_user_id || ' / ' || p_integration_id
    );
    RETURN v_secret_id;
  END IF;

  -- Create new secret
  v_secret_id := vault.create_secret(
    p_value,
    v_secret_name,
    'Integration secret for user ' || p_user_id || ' / ' || p_integration_id
  );
  RETURN v_secret_id;
END;
$$;

-- ─── Helper: read a decrypted user integration secret ────────────────────────
CREATE OR REPLACE FUNCTION read_user_secret(p_secret_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT decrypted_secret INTO v_value
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;

  RETURN v_value;
END;
$$;

-- ─── Helper: delete a user integration secret ────────────────────────────────
CREATE OR REPLACE FUNCTION delete_user_secret(p_secret_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE id = p_secret_id;
END;
$$;

-- ─── Revoke direct vault table access from client roles ──────────────────────
-- (Functions are SECURITY DEFINER so they bypass this; direct access is blocked)
REVOKE ALL ON vault.secrets FROM anon, authenticated;
REVOKE ALL ON vault.decrypted_secrets FROM anon, authenticated;

-- ─── Comments ─────────────────────────────────────────────────────────────────
COMMENT ON FUNCTION store_user_secret IS
  'Stores or updates an encrypted integration secret for a user. Returns the UUID to reference in user_integrations.config.';
COMMENT ON FUNCTION read_user_secret IS
  'Decrypts and returns a user integration secret by its vault UUID.';
COMMENT ON FUNCTION delete_user_secret IS
  'Permanently deletes a user integration secret from vault.';
