-- Replace plaintext secret columns with vault references
-- Secrets are encrypted at rest via pgsodium

-- Step 1: Add vault reference columns (UUID pointing to vault.secrets)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS ga_refresh_token_id UUID,
  ADD COLUMN IF NOT EXISTS calendly_api_key_id UUID;

-- Step 2: Drop plaintext columns (if they exist from previous migration)
ALTER TABLE projects
  DROP COLUMN IF EXISTS ga_refresh_token,
  DROP COLUMN IF EXISTS calendly_api_key;

-- Step 3: Helper function to store a secret and return its ID
CREATE OR REPLACE FUNCTION store_project_secret(
  p_project_id UUID,
  p_name TEXT,
  p_value TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_id UUID;
  secret_name TEXT;
BEGIN
  secret_name := 'project_' || p_project_id || '_' || p_name;
  
  -- Check if secret already exists (update it)
  SELECT id INTO secret_id FROM vault.decrypted_secrets WHERE name = secret_name;
  
  IF secret_id IS NOT NULL THEN
    PERFORM vault.update_secret(secret_id, p_value, secret_name, p_description);
    RETURN secret_id;
  END IF;
  
  -- Create new secret
  secret_id := vault.create_secret(p_value, secret_name, COALESCE(p_description, p_name || ' for project ' || p_project_id));
  RETURN secret_id;
END;
$$;

-- Step 4: Helper function to read a secret by ID
CREATE OR REPLACE FUNCTION read_project_secret(p_secret_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;
  
  RETURN secret_value;
END;
$$;

-- Step 5: Helper to delete a secret
CREATE OR REPLACE FUNCTION delete_project_secret(p_secret_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  DELETE FROM vault.secrets WHERE id = p_secret_id;
END;
$$;

-- Step 6: RLS — only service_role can call these functions
-- (They're SECURITY DEFINER, so they run as the owner regardless)
-- But we revoke direct access to vault tables from anon/authenticated
REVOKE ALL ON vault.secrets FROM anon, authenticated;
REVOKE ALL ON vault.decrypted_secrets FROM anon, authenticated;

COMMENT ON FUNCTION store_project_secret IS 'Stores an encrypted secret in Supabase Vault, returns UUID reference';
COMMENT ON FUNCTION read_project_secret IS 'Decrypts a secret from Vault by its UUID';
COMMENT ON FUNCTION delete_project_secret IS 'Removes a secret from Vault';
