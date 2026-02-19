-- Create example_sites table
CREATE TABLE IF NOT EXISTS example_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  image TEXT NOT NULL,
  tech_stack JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  industry TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_with TEXT, -- Template used to create this
  stats JSONB DEFAULT '{}'::jsonb, -- { views, leads, conversionRate }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger
CREATE TRIGGER set_example_sites_updated_at
  BEFORE UPDATE ON example_sites
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime (updated_at);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_example_sites_category ON example_sites(category);
CREATE INDEX IF NOT EXISTS idx_example_sites_industry ON example_sites(industry);
CREATE INDEX IF NOT EXISTS idx_example_sites_is_featured ON example_sites(is_featured);
CREATE INDEX IF NOT EXISTS idx_example_sites_created_at ON example_sites(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE example_sites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read example sites (public data)
CREATE POLICY "Anyone can view example sites"
  ON example_sites
  FOR SELECT
  USING (true);

-- Insert example data from the existing static data
-- This will be populated via the API or admin interface
-- For now, we'll leave it empty and let it be populated manually or via seed script

