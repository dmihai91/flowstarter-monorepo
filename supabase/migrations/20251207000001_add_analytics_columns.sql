-- Add analytics configuration columns to projects table

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS analytics_ga_property_id TEXT,
ADD COLUMN IF NOT EXISTS analytics_ga_measurement_id TEXT,
ADD COLUMN IF NOT EXISTS analytics_fb_pixel TEXT;

-- Add comments for clarity
COMMENT ON COLUMN projects.analytics_ga_property_id IS 'GA4 Property ID (numeric, e.g., 123456789) - used by server to fetch analytics via Data API';
COMMENT ON COLUMN projects.analytics_ga_measurement_id IS 'GA4 Measurement ID (e.g., G-XXXXXXXXXX) - injected into generated website for client-side tracking';
COMMENT ON COLUMN projects.analytics_fb_pixel IS 'Facebook Pixel ID - optional, injected into generated website';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_analytics_ga_property_id ON projects(analytics_ga_property_id) WHERE analytics_ga_property_id IS NOT NULL;
