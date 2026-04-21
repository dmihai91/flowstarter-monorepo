-- Add generation cost tracking to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS generation_cost_usd numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_credits_used numeric DEFAULT 0;

COMMENT ON COLUMN projects.generation_cost_usd IS 'Total LLM API cost in USD for generating this site';
COMMENT ON COLUMN projects.ai_credits_used IS 'AI credits consumed (1 credit = $0.01 USD)';
