-- Create user_integrations table to store user integration configurations
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, integration_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_id ON user_integrations(integration_id);

-- Add comments for clarity
COMMENT ON TABLE user_integrations IS 'Stores user integration configurations (Google Analytics, Calendly, Mailchimp, etc.)';
COMMENT ON COLUMN user_integrations.user_id IS 'Clerk user ID';
COMMENT ON COLUMN user_integrations.integration_id IS 'Integration identifier (e.g., google-analytics, calendly, mailchimp)';
COMMENT ON COLUMN user_integrations.config IS 'JSON configuration specific to each integration';

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Clerk integration
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (user_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (user_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (user_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'))
  WITH CHECK (user_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (user_id = (SELECT current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_integrations_updated_at();

