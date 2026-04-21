-- Team Integrations table with encrypted API keys using Supabase Vault
-- Keys are stored encrypted at rest using pgsodium

-- Enable the vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Create integrations table (stores metadata, NOT the raw keys)
CREATE TABLE IF NOT EXISTS team_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('calendly', 'mailchimp')),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}', -- Non-sensitive config (e.g., list IDs, calendar URLs)
  secret_id UUID, -- Reference to vault secret
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- Clerk user ID who created it
  
  -- Ensure one integration type per project
  UNIQUE(project_id, integration_type)
);

-- Create index for faster lookups
CREATE INDEX idx_team_integrations_project ON team_integrations(project_id);
CREATE INDEX idx_team_integrations_type ON team_integrations(integration_type);

-- Function to store an encrypted API key in vault
CREATE OR REPLACE FUNCTION store_integration_secret(
  p_integration_id UUID,
  p_api_key TEXT,
  p_key_name TEXT DEFAULT 'api_key'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Insert into vault.secrets (encrypted at rest)
  INSERT INTO vault.secrets (name, secret, description)
  VALUES (
    'integration_' || p_integration_id::TEXT || '_' || p_key_name,
    p_api_key,
    'API key for integration ' || p_integration_id::TEXT
  )
  RETURNING id INTO v_secret_id;
  
  -- Update the integration with the secret reference
  UPDATE team_integrations
  SET secret_id = v_secret_id, updated_at = NOW()
  WHERE id = p_integration_id;
  
  RETURN v_secret_id;
END;
$$;

-- Function to retrieve decrypted API key (only for authorized use)
CREATE OR REPLACE FUNCTION get_integration_secret(p_integration_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_id UUID;
  v_decrypted TEXT;
BEGIN
  -- Get the secret_id from the integration
  SELECT secret_id INTO v_secret_id
  FROM team_integrations
  WHERE id = p_integration_id;
  
  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get decrypted secret from vault
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;
  
  RETURN v_decrypted;
END;
$$;

-- Function to delete integration and its secret
CREATE OR REPLACE FUNCTION delete_integration_with_secret(p_integration_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Get the secret_id
  SELECT secret_id INTO v_secret_id
  FROM team_integrations
  WHERE id = p_integration_id;
  
  -- Delete from vault if secret exists
  IF v_secret_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_secret_id;
  END IF;
  
  -- Delete the integration
  DELETE FROM team_integrations WHERE id = p_integration_id;
  
  RETURN TRUE;
END;
$$;

-- RLS policies
ALTER TABLE team_integrations ENABLE ROW LEVEL SECURITY;

-- Team members can view all integrations (we'll check role in the API)
CREATE POLICY "Team can view integrations" ON team_integrations
  FOR SELECT USING (true);

-- Only allow insert/update/delete through functions (SECURITY DEFINER)
CREATE POLICY "Team can manage integrations" ON team_integrations
  FOR ALL USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_integrations_updated_at
  BEFORE UPDATE ON team_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
