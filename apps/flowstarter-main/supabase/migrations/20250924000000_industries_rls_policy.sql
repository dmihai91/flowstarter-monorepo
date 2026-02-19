-- Enable RLS on industries table
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to industries
-- Industries are reference data that all users (authenticated or not) should be able to read
CREATE POLICY "Allow public read access to industries"
  ON industries
  FOR SELECT
  USING (true);

-- Optional: Add policies for admin operations if needed later
-- For now, only service role can insert/update/delete

